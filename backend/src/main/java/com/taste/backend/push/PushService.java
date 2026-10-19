package com.taste.backend.push;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.taste.backend.common.BadRequestException;
import com.taste.backend.user.User;
import com.taste.backend.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.KeyPair;
import java.security.PrivateKey;
import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Notificacoes no celular (Web Push). O envio roda em segundo plano: uma falha no
 * servico de push nunca atrapalha a curtida ou o comentario que gerou o aviso.
 */
@Service
public class PushService {

    private static final Logger log = LoggerFactory.getLogger(PushService.class);

    /** So servicos de push conhecidos: o servidor nunca faz POST para um endereco qualquer. */
    private static final List<String> ALLOWED_HOST_SUFFIXES = List.of(
            "fcm.googleapis.com", "push.services.mozilla.com", "push.apple.com", "notify.windows.com");
    private static final String SUBJECT = "https://taste-eight-theta.vercel.app";
    private static final Duration REPEAT_WINDOW = Duration.ofMinutes(10);

    public record Message(String title, String body, String url, String tag) { }

    private record Target(String endpoint, String p256dh, String auth) { }

    private final PushKeyRepository keyRepository;
    private final PushSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final ObjectMapper mapper;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final ExecutorService sender = Executors.newFixedThreadPool(2, r -> {
        Thread t = new Thread(r, "web-push");
        t.setDaemon(true);
        return t;
    });
    /** Evita avisos repetidos (curtir, descurtir e curtir de novo). */
    private final Map<String, Instant> recentlySent = new ConcurrentHashMap<>();
    private volatile PushKey keys;

    public PushService(PushKeyRepository keyRepository, PushSubscriptionRepository subscriptionRepository,
                       UserRepository userRepository, ObjectMapper mapper) {
        this.keyRepository = keyRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.mapper = mapper;
    }

    @Transactional
    public String publicKey() {
        return keys().getPublicKey();
    }

    @Transactional
    public void subscribe(Long userId, String endpoint, String p256dh, String auth) {
        validateEndpoint(endpoint);
        try {
            if (WebPushCrypto.fromB64url(p256dh).length != 65 || WebPushCrypto.fromB64url(auth).length != 16) {
                throw new BadRequestException("Inscrição de notificação inválida.");
            }
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Inscrição de notificação inválida.");
        }
        User user = userRepository.getReferenceById(userId);
        // O mesmo aparelho pode trocar de conta: a inscricao passa para quem esta logado
        PushSubscription subscription = subscriptionRepository.findByEndpoint(endpoint)
                .orElseGet(() -> new PushSubscription(user, endpoint, p256dh, auth));
        subscription.setUser(user);
        subscription.setP256dh(p256dh);
        subscription.setAuth(auth);
        subscriptionRepository.save(subscription);
    }

    @Transactional
    public void unsubscribe(Long userId, String endpoint) {
        subscriptionRepository.deleteByEndpointAndUserId(endpoint, userId);
    }

    /** Envia para todos os aparelhos da pessoa; chamado dentro da transacao que gerou o aviso. */
    public void notifyUser(Long userId, String dedupKey, Message message) {
        if (dedupKey != null) {
            Instant last = recentlySent.get(dedupKey);
            if (last != null && last.plus(REPEAT_WINDOW).isAfter(Instant.now())) {
                return;
            }
            if (recentlySent.size() > 10_000) {
                recentlySent.clear();
            }
            recentlySent.put(dedupKey, Instant.now());
        }
        List<Target> targets = subscriptionRepository.findByUserId(userId).stream()
                .map(s -> new Target(s.getEndpoint(), s.getP256dh(), s.getAuth()))
                .toList();
        if (targets.isEmpty()) {
            return;
        }
        PushKey key = keys();
        byte[] payload;
        try {
            payload = mapper.writeValueAsBytes(message);
        } catch (Exception e) {
            return;
        }
        sender.submit(() -> targets.forEach(t -> send(t, payload, key)));
    }

    private void send(Target target, byte[] payload, PushKey key) {
        try {
            URI uri = URI.create(target.endpoint());
            String audience = uri.getScheme() + "://" + uri.getHost();
            PrivateKey privateKey = WebPushCrypto.privateKeyFromPkcs8(WebPushCrypto.fromB64url(key.getPrivateKey()));
            String jwt = WebPushCrypto.vapidJwt(audience, SUBJECT, Instant.now().plus(Duration.ofHours(12)).getEpochSecond(), privateKey);
            byte[] body = WebPushCrypto.encrypt(payload, WebPushCrypto.fromB64url(target.p256dh()), WebPushCrypto.fromB64url(target.auth()));

            HttpRequest request = HttpRequest.newBuilder(uri)
                    .timeout(Duration.ofSeconds(10))
                    .header("TTL", "86400")
                    .header("Urgency", "normal")
                    .header("Content-Encoding", "aes128gcm")
                    .header("Content-Type", "application/octet-stream")
                    .header("Authorization", "vapid t=" + jwt + ", k=" + key.getPublicKey())
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status == 404 || status == 410) {
                // Aparelho desinstalou o app ou revogou a permissao
                subscriptionRepository.deleteByEndpoint(target.endpoint());
            } else if (status >= 400) {
                log.warn("Push recusado ({}) por {}: {}", status, uri.getHost(), response.body());
            }
        } catch (Exception e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("Falha ao enviar push: {}", e.toString());
        }
    }

    private PushKey keys() {
        PushKey current = keys;
        if (current != null) {
            return current;
        }
        synchronized (this) {
            if (keys == null) {
                keys = keyRepository.findById(PushKey.SINGLETON_ID).orElseGet(() -> {
                    KeyPair pair = WebPushCrypto.generateKeyPair();
                    log.info("Push: gerando o par de chaves VAPID do TASTE.");
                    return keyRepository.save(new PushKey(
                            WebPushCrypto.b64url(WebPushCrypto.rawPublicKey(pair.getPublic())),
                            WebPushCrypto.b64url(pair.getPrivate().getEncoded())));
                });
            }
            return keys;
        }
    }

    static void validateEndpoint(String endpoint) {
        URI uri;
        try {
            uri = URI.create(endpoint);
        } catch (Exception e) {
            throw new BadRequestException("Endereço de notificação inválido.");
        }
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase(Locale.ROOT);
        boolean known = ALLOWED_HOST_SUFFIXES.stream().anyMatch(s -> host.equals(s) || host.endsWith("." + s));
        if (!"https".equals(uri.getScheme()) || !known) {
            throw new BadRequestException("Serviço de notificação não suportado.");
        }
    }
}
