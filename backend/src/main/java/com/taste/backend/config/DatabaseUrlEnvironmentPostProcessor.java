package com.taste.backend.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Aceita a variavel DATABASE_URL no formato que o Neon (e o Render) fornecem:
 * postgresql://usuario:senha@host/banco?sslmode=require
 * e a converte para as propriedades spring.datasource.* que o Spring espera.
 * Assim basta colar a connection string do Neon, sem montar a URL JDBC a mao.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    static final String SOURCE_NAME = "databaseUrl";

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = environment.getProperty("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            return;
        }
        Map<String, Object> props = new HashMap<>(toDatasourceProperties(databaseUrl.trim()));
        // Producao: o Hibernate nao mexe no banco (quem muda e o Flyway) e nem confere na partida,
        // para uma diferenca antiga do banco nao derrubar o servidor. A conferencia (validate)
        // roda nos testes do GitHub, num Postgres criado do zero so pelas migracoes.
        boolean validate = Boolean.parseBoolean(environment.getProperty("TASTE_DB_VALIDATE", "false"));
        props.put("spring.jpa.hibernate.ddl-auto", validate ? "validate" : "none");
        environment.getPropertySources().addFirst(new MapPropertySource(SOURCE_NAME, props));
    }

    static Map<String, Object> toDatasourceProperties(String databaseUrl) {
        URI uri = URI.create(databaseUrl);
        String scheme = uri.getScheme();
        if (!"postgres".equals(scheme) && !"postgresql".equals(scheme)) {
            throw new IllegalStateException("DATABASE_URL deve comecar com postgresql:// (recebido: " + scheme + "://)");
        }

        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://").append(uri.getHost());
        if (uri.getPort() != -1) {
            jdbcUrl.append(':').append(uri.getPort());
        }
        jdbcUrl.append(uri.getRawPath());
        String query = uri.getRawQuery();
        if (query == null || query.isBlank()) {
            jdbcUrl.append("?sslmode=require");
        } else {
            jdbcUrl.append('?').append(query);
        }
        // O Neon passa as conexoes por um pooler (PgBouncer) que reaproveita consultas preparadas.
        // Quando a estrutura de uma tabela muda (o Hibernate cria colunas/tabelas na partida),
        // o Postgres recusa a consulta guardada ("cached plan must not change result type").
        // Sem consultas preparadas no servidor, isso nao acontece.
        if (!jdbcUrl.toString().contains("prepareThreshold=")) {
            jdbcUrl.append("&prepareThreshold=0");
        }

        Map<String, Object> props = new HashMap<>();
        props.put("spring.datasource.url", jdbcUrl.toString());
        // Com Postgres, a estrutura do banco e controlada pelas migracoes do Flyway
        props.put("spring.flyway.enabled", "true");

        String userInfo = uri.getRawUserInfo();
        if (userInfo != null) {
            int colon = userInfo.indexOf(':');
            String user = colon >= 0 ? userInfo.substring(0, colon) : userInfo;
            String password = colon >= 0 ? userInfo.substring(colon + 1) : "";
            props.put("spring.datasource.username", URLDecoder.decode(user, StandardCharsets.UTF_8));
            props.put("spring.datasource.password", URLDecoder.decode(password, StandardCharsets.UTF_8));
        }
        return props;
    }

    @Override
    public int getOrder() {
        return Ordered.LOWEST_PRECEDENCE;
    }
}
