package com.taste.backend.user.social;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** A conferencia real do token, com uma chave de teste no lugar das chaves do Google e da Apple. */
class SocialTokenVerifierTests {

    private static final String NONCE = "nonce-do-login";
    private static KeyPair keys;
    private static KeyPair otherKeys;

    private final SocialTokenVerifier verifier = new SocialTokenVerifier("google-app", "apple.app", new ObjectMapper(),
            provider -> NimbusJwtDecoder.withPublicKey((RSAPublicKey) keys.getPublic()).build());

    @BeforeAll
    static void createKeys() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        keys = generator.generateKeyPair();
        otherKeys = generator.generateKeyPair();
    }

    private static JWTClaimsSet.Builder claims(String issuer, String audience) {
        return new JWTClaimsSet.Builder()
                .issuer(issuer)
                .audience(audience)
                .subject("pessoa-123")
                .claim("nonce", NONCE)
                .claim("email", "pessoa@exemplo.com")
                .issueTime(new Date())
                .expirationTime(Date.from(Instant.now().plusSeconds(600)));
    }

    private static String sign(JWTClaimsSet claims, KeyPair signer) throws Exception {
        SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256).type(JOSEObjectType.JWT).build(), claims);
        jwt.sign(new RSASSASigner(signer.getPrivate()));
        return jwt.serialize();
    }

    @Test
    void aceitaTokenDoGoogle() throws Exception {
        String token = sign(claims("https://accounts.google.com", "google-app")
                .claim("email_verified", true).claim("name", "Pessoa Exemplo").build(), keys);

        VerifiedIdentity identity = verifier.verify(SocialProvider.GOOGLE, token, NONCE, null);

        assertThat(identity.subject()).isEqualTo("pessoa-123");
        assertThat(identity.email()).isEqualTo("pessoa@exemplo.com");
        assertThat(identity.emailVerified()).isTrue();
        assertThat(identity.name()).isEqualTo("Pessoa Exemplo");
    }

    @Test
    void naAppleOEmailConfirmadoVemComoTextoEONomeNumCampoAParte() throws Exception {
        String token = sign(claims("https://appleid.apple.com", "apple.app").claim("email_verified", "true").build(), keys);

        VerifiedIdentity identity = verifier.verify(SocialProvider.APPLE, token, NONCE,
                "{\"name\":{\"firstName\":\"Pessoa\",\"lastName\":\"Exemplo\"}}");

        assertThat(identity.emailVerified()).isTrue();
        assertThat(identity.name()).isEqualTo("Pessoa Exemplo");
    }

    @Test
    void recusaAssinaturaDeOutraChave() throws Exception {
        String token = sign(claims("https://accounts.google.com", "google-app").build(), otherKeys);

        assertThatThrownBy(() -> verifier.verify(SocialProvider.GOOGLE, token, NONCE, null)).isInstanceOf(JwtException.class);
    }

    @Test
    void recusaTokenFeitoParaOutroApp() throws Exception {
        String token = sign(claims("https://accounts.google.com", "app-de-outra-pessoa").build(), keys);

        assertThatThrownBy(() -> verifier.verify(SocialProvider.GOOGLE, token, NONCE, null)).isInstanceOf(JwtException.class);
    }

    @Test
    void recusaOutroEmissor() throws Exception {
        String token = sign(claims("https://appleid.apple.com", "google-app").build(), keys);

        assertThatThrownBy(() -> verifier.verify(SocialProvider.GOOGLE, token, NONCE, null)).isInstanceOf(JwtException.class);
    }

    @Test
    void recusaTokenDeOutroLogin() throws Exception {
        String token = sign(claims("https://accounts.google.com", "google-app").build(), keys);

        assertThatThrownBy(() -> verifier.verify(SocialProvider.GOOGLE, token, "nonce-de-outro-login", null)).isInstanceOf(JwtException.class);
    }

    @Test
    void recusaTokenVencido() throws Exception {
        String token = sign(claims("https://accounts.google.com", "google-app")
                .expirationTime(Date.from(Instant.now().minusSeconds(3600))).build(), keys);

        assertThatThrownBy(() -> verifier.verify(SocialProvider.GOOGLE, token, NONCE, null)).isInstanceOf(JwtException.class);
    }

    @Test
    void semIdOProvedorFicaDesligado() {
        SocialTokenVerifier withoutApple = new SocialTokenVerifier("google-app", "", new ObjectMapper(), provider -> null);

        assertThat(withoutApple.isEnabled(SocialProvider.GOOGLE)).isTrue();
        assertThat(withoutApple.isEnabled(SocialProvider.APPLE)).isFalse();
    }
}
