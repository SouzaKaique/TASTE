package com.taste.backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taste.backend.demo.DemoDataService;
import com.taste.backend.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Fluxos principais da API ponta a ponta, com H2 em memória. */
@SpringBootTest
@AutoConfigureMockMvc
class ApiFlowTests {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired DemoDataService demoData;
    @Autowired UserRepository users;

    /** Conta de teste com nome único, para os testes não dependerem da ordem. */
    private record Account(long id, String username, String email, String token) {
        String bearer() { return "Bearer " + token; }
    }

    private Account register() throws Exception {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        String username = "t_" + suffix;
        String email = username + "@taste.test";
        String body = json.writeValueAsString(Map.of(
                "displayName", "Teste " + suffix, "username", username,
                "email", email, "password", "senha-teste-123"));
        String res = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode node = json.readTree(res);
        return new Account(node.at("/user/id").asLong(), username, email, node.get("token").asText());
    }

    private long createExperience(Account a, String visibility) throws Exception {
        String body = json.writeValueAsString(Map.of(
                "dishName", "Prato " + visibility, "category", "Prato principal", "cuisineType", "Brasileira",
                "restaurantName", "Restaurante Teste", "city", "Londrina", "date", LocalDate.now().toString(),
                "rating", 5, "visibility", visibility));
        String res = mvc.perform(post("/api/experiences").header("Authorization", a.bearer())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().is2xxSuccessful())
                .andReturn().getResponse().getContentAsString();
        return json.readTree(res).get("id").asLong();
    }

    private void befriend(Account a, Account b) throws Exception {
        mvc.perform(post("/api/friends/" + b.id()).header("Authorization", a.bearer())).andExpect(status().is2xxSuccessful());
        mvc.perform(post("/api/friends/" + a.id() + "/accept").header("Authorization", b.bearer())).andExpect(status().is2xxSuccessful());
    }

    private String login(String email, String password) throws Exception {
        return json.writeValueAsString(Map.of("email", email, "password", password));
    }

    @Test
    void registraEntraEConsultaOProprioPerfil() throws Exception {
        Account a = register();
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login(a.email(), "senha-teste-123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());
        mvc.perform(get("/api/users/me").header("Authorization", a.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(a.username()));
    }

    @Test
    void rotasProtegidasExigemToken() throws Exception {
        mvc.perform(get("/api/feed")).andExpect(status().is4xxClientError());
        mvc.perform(get("/api/users/me")).andExpect(status().is4xxClientError());
    }

    @Test
    void emailInexistenteESenhaErradaRespondemIgual() throws Exception {
        Account a = register();
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login(a.email(), "errada-123")))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login("ninguem@taste.test", "errada-123")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void bloqueiaLoginAposMuitasTentativas() throws Exception {
        Account a = register();
        for (int i = 0; i < 8; i++) {
            mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login(a.email(), "errada-123")))
                    .andExpect(status().isUnauthorized());
        }
        // Mesmo com a senha certa, fica bloqueado até a janela passar
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(login(a.email(), "senha-teste-123")))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    void experienciaPrivadaSoODonoVe() throws Exception {
        Account dono = register();
        Account amigo = register();
        befriend(dono, amigo);
        long privada = createExperience(dono, "private");
        long deAmigos = createExperience(dono, "friends");

        mvc.perform(get("/api/experiences/" + privada).header("Authorization", dono.bearer())).andExpect(status().isOk());
        mvc.perform(get("/api/experiences/" + privada).header("Authorization", amigo.bearer())).andExpect(status().isNotFound());
        mvc.perform(get("/api/experiences/" + deAmigos).header("Authorization", amigo.bearer())).andExpect(status().isOk());

        Account estranho = register();
        mvc.perform(get("/api/experiences/" + deAmigos).header("Authorization", estranho.bearer())).andExpect(status().isNotFound());
    }

    @Test
    void amizadeFeedCurtidaComentarioENotificacoes() throws Exception {
        Account autor = register();
        Account amigo = register();
        befriend(autor, amigo);
        long exp = createExperience(autor, "friends");

        // O amigo vê no feed e interage
        String feed = mvc.perform(get("/api/feed").header("Authorization", amigo.bearer()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(feed).contains("\"experienceId\":" + exp);

        mvc.perform(post("/api/experiences/" + exp + "/like").header("Authorization", amigo.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likesCount").value(1))
                .andExpect(jsonPath("$.likedByMe").value(true));

        String comentado = mvc.perform(post("/api/experiences/" + exp + "/comments").header("Authorization", amigo.bearer())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"text\":\"Quero ir!\"}"))
                .andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.comments[0].text").value("Quero ir!"))
                .andReturn().getResponse().getContentAsString();
        long commentId = json.readTree(comentado).at("/comments/0/id").asLong();

        // O autor recebe: aceite de amizade não (ele enviou o pedido), curtida e comentário sim
        mvc.perform(get("/api/notifications/unread-count").header("Authorization", autor.bearer()))
                .andExpect(status().isOk());
        String notifs = mvc.perform(get("/api/notifications").header("Authorization", autor.bearer()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(notifs).contains("\"type\":\"like\"").contains("\"type\":\"comment\"").contains("\"type\":\"friend-accepted\"");

        // Só quem comentou (ou o dono) pode apagar o comentário
        Account outro = register();
        befriend(autor, outro);
        mvc.perform(delete("/api/experiences/" + exp + "/comments/" + commentId).header("Authorization", outro.bearer()))
                .andExpect(status().is4xxClientError());
        mvc.perform(delete("/api/experiences/" + exp + "/comments/" + commentId).header("Authorization", amigo.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.comments").isEmpty());

        mvc.perform(post("/api/notifications/read-all").header("Authorization", autor.bearer())).andExpect(status().is2xxSuccessful());
    }

    @Test
    void dadosDeDemonstracaoEntramESaem() throws Exception {
        Account alvo = register();
        demoData.seedFor(alvo.username());
        long demos = users.findByUsernameStartingWith("demo.").size();
        assertThat(demos).isEqualTo(6);

        // Rodar de novo não duplica
        demoData.seedFor(alvo.username());
        assertThat(users.findByUsernameStartingWith("demo.")).hasSize(6);

        mvc.perform(get("/api/feed").header("Authorization", alvo.bearer()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isNotEmpty());

        demoData.removeAll();
        assertThat(users.findByUsernameStartingWith("demo.")).isEmpty();
        // A conta real continua funcionando
        mvc.perform(get("/api/feed").header("Authorization", alvo.bearer())).andExpect(status().isOk());
    }
}
