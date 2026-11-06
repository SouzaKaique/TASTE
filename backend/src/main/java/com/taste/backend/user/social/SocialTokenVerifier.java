package com.taste.backend.user.social;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

/**
 * Confere o token de identidade (id_token) devolvido pelo Google ou pela Apple:
 * assinatura com as chaves publicas do provedor, validade, emissor, destinatario (o nosso app) e nonce.
 */
@Component
public class SocialTokenVerifier {

    private static final Map<SocialProvider, String> KEYS_URL = Map.of(
            SocialProvider.GOOGLE, "https://www.googleapis.com/oauth2/v3/certs",
            SocialProvider.APPLE, "https://appleid.apple.com/auth/keys");

    private static final Map<SocialProvider, Set<String>> ISSUERS = Map.of(
            SocialProvider.GOOGLE, Set.of("https://accounts.google.com", "accounts.google.com"),
            SocialProvider.APPLE, Set.of("https://appleid.apple.com"));

    private final Map<SocialProvider, String> clientIds = new EnumMap<>(SocialProvider.class);
    private final Map<SocialProvider, JwtDecoder> decoders = new EnumMap<>(SocialProvider.class);
    private final Function<SocialProvider, JwtDecoder> decoderFactory;
    private final ObjectMapper mapper;

    @Autowired
    public SocialTokenVerifier(
            @Value("${taste.social.google-client-id}") String googleClientId,
            @Value("${taste.social.apple-client-id}") String appleClientId,
            ObjectMapper mapper
    ) {
        this(googleClientId, appleClientId, mapper,
                // As chaves sao baixadas no primeiro uso e guardadas pela propria biblioteca
                provider -> NimbusJwtDecoder.withJwkSetUri(KEYS_URL.get(provider)).build());
    }

    SocialTokenVerifier(String googleClientId, String appleClientId, ObjectMapper mapper,
                        Function<SocialProvider, JwtDecoder> decoderFactory) {
        this.clientIds.put(SocialProvider.GOOGLE, googleClientId);
        this.clientIds.put(SocialProvider.APPLE, appleClientId);
        this.mapper = mapper;
        this.decoderFactory = decoderFactory;
    }

    public boolean isEnabled(SocialProvider provider) {
        String clientId = clientIds.get(provider);
        return clientId != null && !clientId.isBlank();
    }

    public String clientId(SocialProvider provider) {
        return clientIds.get(provider);
    }

    /**
     * @param appleUser na Apple, o nome so vem no primeiro login, num campo a parte (JSON) e sem assinatura:
     *                  serve apenas para o nome de exibicao
     * @throws JwtException se o token nao for valido para este login
     */
    public VerifiedIdentity verify(SocialProvider provider, String idToken, String expectedNonce, String appleUser) {
        Jwt jwt = decoder(provider).decode(idToken);
        if (!ISSUERS.get(provider).contains(jwt.getClaimAsString("iss"))) {
            throw new JwtException("Emissor inesperado.");
        }
        if (jwt.getAudience() == null || !jwt.getAudience().contains(clientId(provider))) {
            throw new JwtException("Token emitido para outro app.");
        }
        if (!expectedNonce.equals(jwt.getClaimAsString("nonce"))) {
            throw new JwtException("Nonce diferente do esperado.");
        }
        if (jwt.getSubject() == null || jwt.getSubject().isBlank()) {
            throw new JwtException("Token sem identificador da pessoa.");
        }
        // O Google manda booleano; a Apple, texto
        boolean emailVerified = "true".equals(String.valueOf(jwt.getClaims().get("email_verified")));
        String name = provider == SocialProvider.GOOGLE ? jwt.getClaimAsString("name") : appleName(appleUser);
        return new VerifiedIdentity(provider, jwt.getSubject(), jwt.getClaimAsString("email"), emailVerified, name);
    }

    private synchronized JwtDecoder decoder(SocialProvider provider) {
        return decoders.computeIfAbsent(provider, decoderFactory);
    }

    private String appleName(String appleUser) {
        if (appleUser == null || appleUser.isBlank()) {
            return null;
        }
        try {
            JsonNode name = mapper.readTree(appleUser).path("name");
            String full = (name.path("firstName").asText("") + " " + name.path("lastName").asText("")).trim();
            return full.isEmpty() ? null : full;
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            return null;
        }
    }
}
