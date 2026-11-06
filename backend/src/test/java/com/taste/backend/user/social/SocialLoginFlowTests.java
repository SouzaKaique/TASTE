package com.taste.backend.user.social;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taste.backend.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.test.web.servlet.MockMvc;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** O caminho completo do login com Google/Apple pela API. A conferencia do token esta em SocialTokenVerifierTests. */
@SpringBootTest(properties = "taste.social.public-api-url=https://api.taste.test")
@AutoConfigureMockMvc
class SocialLoginFlowTests {

    private static final String SITE = "http://localhost:4200";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @MockBean SocialTokenVerifier verifier;

    @BeforeEach
    void bothProvidersConfigured() {
        when(verifier.isEnabled(any())).thenReturn(true);
        when(verifier.clientId(SocialProvider.GOOGLE)).thenReturn("google-app");
        when(verifier.clientId(SocialProvider.APPLE)).thenReturn("apple.app");
    }

    private record Flow(String verifier, String state) {
    }

    private static Flow newFlow() throws Exception {
        String code = UUID.randomUUID() + "-" + UUID.randomUUID();
        byte[] digest = MessageDigest.getInstance("SHA-256").digest(code.getBytes(StandardCharsets.UTF_8));
        return new Flow(code, Base64.getUrlEncoder().withoutPadding().encodeToString(digest));
    }

    private static String email() {
        return "social_" + UUID.randomUUID().toString().substring(0, 8) + "@exemplo.com";
    }

    private static VerifiedIdentity google(String subject, String email, boolean verified) {
        return new VerifiedIdentity(SocialProvider.GOOGLE, subject, email, verified, "Pessoa Teste");
    }

    /** Faz start + retorno do provedor com esta identidade. */
    private Flow signInAt(VerifiedIdentity identity) throws Exception {
        Flow flow = newFlow();
        when(verifier.verify(eq(identity.provider()), eq("token-" + flow.state()), eq(flow.state()), any())).thenReturn(identity);
        String provider = identity.provider().path();
        mvc.perform(get("/api/auth/social/" + provider + "/start").param("state", flow.state()).param("origin", SITE))
                .andExpect(status().isFound());
        mvc.perform(post("/api/auth/social/" + provider + "/callback")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("state", flow.state())
                        .param("id_token", "token-" + flow.state()))
                .andExpect(status().isSeeOther());
        return flow;
    }

    private JsonNode result(Flow flow) throws Exception {
        String body = mvc.perform(post("/api/auth/social/result").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("verifier", flow.verifier()))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(body);
    }

    private void registerWithPassword(String email, String password) throws Exception {
        String username = "pw" + UUID.randomUUID().toString().substring(0, 8);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(Map.of(
                        "displayName", "Dona da conta", "username", username, "email", email, "password", password))))
                .andExpect(status().isCreated());
    }

    private String loginBody(String email, String password) throws Exception {
        return json.writeValueAsString(Map.of("email", email, "password", password));
    }

    @Test
    void mostraSoOsProvedoresConfigurados() throws Exception {
        when(verifier.isEnabled(SocialProvider.APPLE)).thenReturn(false);

        mvc.perform(get("/api/auth/social/providers"))
                .andExpect(jsonPath("$.google").value(true))
                .andExpect(jsonPath("$.apple").value(false));
    }

    @Test
    void levaAoProvedorComOEnderecoDeRetornoEONonce() throws Exception {
        Flow flow = newFlow();

        String location = mvc.perform(get("/api/auth/social/google/start").param("state", flow.state()).param("origin", SITE))
                .andExpect(status().isFound())
                .andReturn().getResponse().getHeader("Location");

        assertThat(location).startsWith("https://accounts.google.com/o/oauth2/v2/auth?client_id=google-app");
        assertThat(location).contains("redirect_uri=https://api.taste.test/api/auth/social/google/callback");
        assertThat(location).contains("response_type=id_token").contains("response_mode=form_post");
        assertThat(location).contains("nonce=" + flow.state());
    }

    @Test
    void recusaIniciarLoginParaSiteDesconhecido() throws Exception {
        mvc.perform(get("/api/auth/social/google/start").param("state", newFlow().state()).param("origin", "https://site-falso.com"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void primeiroLoginCriaAContaEOSeguinteEntraNela() throws Exception {
        String subject = UUID.randomUUID().toString();
        String email = email();
        VerifiedIdentity identity = google(subject, email, true);

        JsonNode first = result(signInAt(identity));
        assertThat(first.path("status").asText()).isEqualTo("done");
        assertThat(first.path("newAccount").asBoolean()).isTrue();
        assertThat(first.path("user").path("email").asText()).isEqualTo(email);
        assertThat(first.path("user").path("username").asText()).matches("^[a-z0-9._]{3,20}$");

        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + first.path("token").asText()))
                .andExpect(status().isOk());

        JsonNode second = result(signInAt(identity));
        assertThat(second.path("newAccount").asBoolean()).isFalse();
        assertThat(second.path("user").path("id").asLong()).isEqualTo(first.path("user").path("id").asLong());
    }

    @Test
    void oResultadoSoPodeSerResgatadoUmaVez() throws Exception {
        Flow flow = signInAt(google(UUID.randomUUID().toString(), email(), true));

        result(flow);

        mvc.perform(post("/api/auth/social/result").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("verifier", flow.verifier()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void oStateDaUrlNaoAbreASessao() throws Exception {
        Flow flow = signInAt(google(UUID.randomUUID().toString(), email(), true));

        mvc.perform(post("/api/auth/social/result").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("verifier", flow.state()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void enquantoAPessoaEstaNoProvedorOResultadoFicaPendente() throws Exception {
        Flow flow = newFlow();
        mvc.perform(get("/api/auth/social/apple/start").param("state", flow.state()).param("origin", SITE))
                .andExpect(status().isFound());

        assertThat(result(flow).path("status").asText()).isEqualTo("pending");
    }

    @Test
    void contaComSenhaSoLigaDepoisDeConfirmarASenha() throws Exception {
        String email = email();
        registerWithPassword(email, "senha-da-dona-123");
        VerifiedIdentity identity = google(UUID.randomUUID().toString(), email, true);

        Flow flow = signInAt(identity);
        JsonNode pending = result(flow);
        assertThat(pending.path("status").asText()).isEqualTo("link-required");
        assertThat(pending.path("token").isNull()).isTrue();

        mvc.perform(post("/api/auth/social/link").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("verifier", flow.verifier(), "password", "senha-errada"))))
                .andExpect(status().isUnauthorized());

        mvc.perform(post("/api/auth/social/link").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("verifier", flow.verifier(), "password", "senha-da-dona-123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("done"));

        // Da proxima vez entra direto, e a senha continua valendo
        assertThat(result(signInAt(identity)).path("status").asText()).isEqualTo("done");
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody(email, "senha-da-dona-123")))
                .andExpect(status().isOk());
    }

    @Test
    void recusaEmailNaoConfirmadoPeloProvedor() throws Exception {
        Flow flow = signInAt(google(UUID.randomUUID().toString(), email(), false));

        mvc.perform(post("/api/auth/social/result").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("verifier", flow.verifier()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void contaSocialNaoEntraPorSenha() throws Exception {
        String email = email();
        result(signInAt(google(UUID.randomUUID().toString(), email, true)));

        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody(email, "qualquer-senha")))
                .andExpect(status().isUnauthorized());
        // A senha interna usada para igualar o tempo de resposta tambem nao abre a conta
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody(email, "taste-dummy-password-for-timing")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void mesmaPessoaPeloGoogleEPelaAppleUsaAMesmaConta() throws Exception {
        String email = email();
        JsonNode viaGoogle = result(signInAt(google(UUID.randomUUID().toString(), email, true)));

        VerifiedIdentity apple = new VerifiedIdentity(SocialProvider.APPLE, UUID.randomUUID().toString(), email, true, null);
        JsonNode viaApple = result(signInAt(apple));

        assertThat(viaApple.path("status").asText()).isEqualTo("done");
        assertThat(viaApple.path("user").path("id").asLong()).isEqualTo(viaGoogle.path("user").path("id").asLong());
    }

    @Test
    void oRetornoVindoDoSiteDaAppleNaoEBloqueadoPeloCors() throws Exception {
        Flow flow = newFlow();
        VerifiedIdentity identity = new VerifiedIdentity(SocialProvider.APPLE, UUID.randomUUID().toString(), email(), true, "Pessoa");
        when(verifier.verify(eq(SocialProvider.APPLE), anyString(), eq(flow.state()), any())).thenReturn(identity);
        mvc.perform(get("/api/auth/social/apple/start").param("state", flow.state()).param("origin", SITE)
                        .param("janela", "true"))
                .andExpect(status().isFound());

        mvc.perform(post("/api/auth/social/apple/callback")
                        .header("Origin", "https://appleid.apple.com")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("state", flow.state())
                        .param("id_token", "token"))
                .andExpect(status().isSeeOther())
                .andExpect(header().string("Location", SITE + "/entrar/social?state=" + flow.state() + "&janela=1"));
    }

    @Test
    void tokenInvalidoViraErroNoResultado() throws Exception {
        Flow flow = newFlow();
        when(verifier.verify(any(), anyString(), anyString(), any())).thenThrow(new JwtException("assinatura errada"));
        mvc.perform(get("/api/auth/social/google/start").param("state", flow.state()).param("origin", SITE))
                .andExpect(status().isFound());
        mvc.perform(post("/api/auth/social/google/callback").contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("state", flow.state()).param("id_token", "falso"))
                .andExpect(status().isSeeOther());

        mvc.perform(post("/api/auth/social/result").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("verifier", flow.verifier()))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cancelarNoProvedorEncerraOLogin() throws Exception {
        Flow flow = newFlow();
        mvc.perform(get("/api/auth/social/google/start").param("state", flow.state()).param("origin", SITE))
                .andExpect(status().isFound());
        mvc.perform(post("/api/auth/social/google/callback").contentType(MediaType.APPLICATION_FORM_URLENCODED)
                        .param("state", flow.state()).param("error", "access_denied"))
                .andExpect(status().isSeeOther());

        mvc.perform(post("/api/auth/social/result").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("verifier", flow.verifier()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Login cancelado."));
    }

    @Test
    void siteServidoPeloProprioBackendPodeLogar() throws Exception {
        mvc.perform(get("/api/auth/social/google/start").param("state", newFlow().state()).param("origin", "https://api.taste.test"))
                .andExpect(status().isFound());
    }
}
