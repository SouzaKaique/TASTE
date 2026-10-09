package com.taste.backend.config;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DatabaseUrlEnvironmentPostProcessorTests {

    @Test
    void convertsNeonConnectionString() {
        Map<String, Object> props = DatabaseUrlEnvironmentPostProcessor.toDatasourceProperties(
                "postgresql://neondb_owner:abc123@ep-cool-tree-a1b2c3.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

        assertThat(props)
                .containsEntry("spring.datasource.url",
                        "jdbc:postgresql://ep-cool-tree-a1b2c3.sa-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require")
                .containsEntry("spring.datasource.username", "neondb_owner")
                .containsEntry("spring.datasource.password", "abc123");
    }

    @Test
    void keepsPortAndDecodesSpecialCharactersInPassword() {
        Map<String, Object> props = DatabaseUrlEnvironmentPostProcessor.toDatasourceProperties(
                "postgres://user:p%40ss%3Aword@localhost:5432/taste");

        assertThat(props)
                .containsEntry("spring.datasource.url", "jdbc:postgresql://localhost:5432/taste?sslmode=require")
                .containsEntry("spring.datasource.password", "p@ss:word");
    }

    @Test
    void rejectsJdbcStyleUrl() {
        assertThatThrownBy(() -> DatabaseUrlEnvironmentPostProcessor.toDatasourceProperties("jdbc:postgresql://host/db"))
                .isInstanceOf(IllegalStateException.class);
    }
}
