package com.taste.backend.user.social;

import com.taste.backend.common.BadRequestException;
import com.taste.backend.common.NotFoundException;
import com.taste.backend.common.TooManyRequestsException;
import com.taste.backend.user.UserService;
import com.taste.backend.user.dto.AuthResponse;
import com.taste.backend.user.dto.UserResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.stereotype.Service;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.util.UriComponentsBuilder;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Login com Google e Apple, sem segredo no site e sem scripts de terceiros.
 *
 * 1. O site cria um segredo (verifier), guarda com ele e abre /start com o hash dele (state).
 * 2. O provedor devolve o token de identidade neste backend (/callback), que o confere e o deixa aguardando.
 * 3. O site troca o verifier pela sessao (/result).
 *
 * A sessao nunca passa por uma URL, e so quem iniciou o login consegue resgata-la. Assim tambem funciona no
 * app instalado do iPhone, onde o login abre numa janela separada e o app apenas espera o resultado.
 */
@Service
public class SocialAuthService {

    private static final Logger log = LoggerFactory.getLogger(SocialAuthService.class);

    private static final Duration FLOW_TTL = Duration.ofMinutes(10);
    private static final int MAX_FLOWS = 5_000;
    /** Hash SHA-256 em base64url, sem preenchimento. */
    private static final String STATE_FORMAT = "[A-Za-z0-9_-]{43}";

    private static final class Flow {
        final SocialProvider provider;
        final String origin;
        final boolean separateWindow;
        final Instant createdAt = Instant.now();
        volatile VerifiedIdentity identity;
        volatile String failure;

        Flow(SocialProvider provider, String origin, boolean separateWindow) {
            this.provider = provider;
            this.origin = origin;
            this.separateWindow = separateWindow;
        }
    }

    public record Providers(boolean google, boolean apple) {
    }

    /** status: pending (ainda no provedor), done (entrou) ou link-required (confirmar a senha da conta). */
    public record Result(String status, String token, UserResponse user, Boolean newAccount, String email) {
        static Result pending() {
            return new Result("pending", null, null, null, null);
        }

        static Result linkRequired(String email) {
            return new Result("link-required", null, null, null, email);
        }

        static Result done(AuthResponse session, boolean newAccount) {
            return new Result("done", session.token(), session.user(), newAccount, null);
        }
    }

    private final SocialTokenVerifier verifier;
    private final UserService userService;
    private final String publicApiUrl;
    private final CorsConfiguration allowedSites = new CorsConfiguration();
    private final Map<String, Flow> flows = new ConcurrentHashMap<>();

    public SocialAuthService(
            SocialTokenVerifier verifier,
            UserService userService,
            @Value("${taste.social.public-api-url}") String publicApiUrl,
            @Value("${taste.cors.allowed-origins}") String allowedOrigins
    ) {
        this.verifier = verifier;
        this.userService = userService;
        this.publicApiUrl = publicApiUrl;
        allowedSites.setAllowedOriginPatterns(Arrays.stream(allowedOrigins.split(",")).map(String::trim).toList());
    }

    public Providers providers() {
        return new Providers(verifier.isEnabled(SocialProvider.GOOGLE), verifier.isEnabled(SocialProvider.APPLE));
    }

    /** Registra o login e devolve o endereco do provedor. requestBaseUrl vale quando TASTE_PUBLIC_API_URL esta vazia. */
    public String start(SocialProvider provider, String state, String origin, boolean separateWindow, String requestBaseUrl) {
        if (!verifier.isEnabled(provider)) {
            throw new NotFoundException("Este login não está disponível.");
        }
        if (state == null || !state.matches(STATE_FORMAT)) {
            throw new BadRequestException("Pedido de login inválido.");
        }
        String baseUrl = baseUrl(requestBaseUrl);
        // Site servido pelo proprio backend (Docker) ou listado no CORS: nunca um endereco qualquer
        if (origin == null || !(origin.equals(baseUrl) || allowedSites.checkOrigin(origin) != null)) {
            throw new BadRequestException("Site não autorizado para este login.");
        }
        removeExpired();
        if (flows.size() >= MAX_FLOWS) {
            throw new TooManyRequestsException("Muitos logins ao mesmo tempo. Tente de novo em instantes.");
        }
        flows.put(state, new Flow(provider, origin, separateWindow));
        return providerUrl(provider, state, baseUrl);
    }

    /** Recebe o token do provedor e devolve para onde mandar a pessoa, ou null se este login nao existir mais. */
    public String callback(SocialProvider provider, String state, String idToken, String appleUser, String error) {
        Flow flow = state == null ? null : flows.get(state);
        if (flow == null || flow.provider != provider) {
            return null;
        }
        if (error != null || idToken == null) {
            flow.failure = "Login cancelado.";
        } else {
            try {
                flow.identity = verifier.verify(provider, idToken, state, appleUser);
            } catch (JwtException e) {
                log.warn("Login social recusado ({}): {}", provider, e.getMessage());
                flow.failure = "Não foi possível confirmar sua conta. Tente de novo.";
            }
        }
        return UriComponentsBuilder.fromHttpUrl(flow.origin).path("/entrar/social")
                .queryParam("state", state)
                .queryParamIfPresent("janela", java.util.Optional.ofNullable(flow.separateWindow ? "1" : null))
                .build().toUriString();
    }

    public Result result(String verifierCode) {
        String state = hash(verifierCode);
        Flow flow = activeFlow(state);
        if (flow.failure != null) {
            flows.remove(state);
            throw new BadRequestException(flow.failure);
        }
        if (flow.identity == null) {
            return Result.pending();
        }
        UserService.SocialLogin login;
        try {
            login = userService.loginWithSocial(flow.identity);
        } catch (BadRequestException e) {
            flows.remove(state);
            throw e;
        }
        if (login.linkEmail() != null) {
            return Result.linkRequired(login.linkEmail());
        }
        flows.remove(state);
        return Result.done(login.session(), login.newAccount());
    }

    /** Confirma a senha da conta que ja usava este e-mail e liga o Google/Apple a ela. */
    public Result link(String verifierCode, String password) {
        String state = hash(verifierCode);
        Flow flow = activeFlow(state);
        if (flow.identity == null) {
            throw new BadRequestException("Este login expirou. Comece de novo.");
        }
        AuthResponse session = userService.linkSocial(flow.identity, password);
        flows.remove(state);
        return Result.done(session, false);
    }

    private Flow activeFlow(String state) {
        Flow flow = flows.get(state);
        if (flow == null || isExpired(flow)) {
            flows.remove(state);
            throw new BadRequestException("Este login expirou. Comece de novo.");
        }
        return flow;
    }

    private String baseUrl(String requestBaseUrl) {
        String base = publicApiUrl == null || publicApiUrl.isBlank() ? requestBaseUrl : publicApiUrl.trim();
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }

    private String providerUrl(SocialProvider provider, String state, String baseUrl) {
        boolean google = provider == SocialProvider.GOOGLE;
        UriComponentsBuilder url = UriComponentsBuilder
                .fromHttpUrl(google ? "https://accounts.google.com/o/oauth2/v2/auth" : "https://appleid.apple.com/auth/authorize")
                .queryParam("client_id", verifier.clientId(provider))
                .queryParam("redirect_uri", baseUrl + "/api/auth/social/" + provider.path() + "/callback")
                .queryParam("response_type", google ? "id_token" : "code id_token")
                .queryParam("response_mode", "form_post")
                .queryParam("scope", google ? "openid email profile" : "name email")
                .queryParam("state", state)
                .queryParam("nonce", state);
        if (google) {
            url.queryParam("prompt", "select_account");
        }
        return url.encode(StandardCharsets.UTF_8).build().toUriString();
    }

    private void removeExpired() {
        flows.values().removeIf(this::isExpired);
    }

    private boolean isExpired(Flow flow) {
        return flow.createdAt.plus(FLOW_TTL).isBefore(Instant.now());
    }

    private static String hash(String verifierCode) {
        if (verifierCode == null || verifierCode.isBlank()) {
            throw new BadRequestException("Este login expirou. Comece de novo.");
        }
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(verifierCode.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
