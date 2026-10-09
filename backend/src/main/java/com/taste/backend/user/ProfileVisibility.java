package com.taste.backend.user;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ProfileVisibility {
    PUBLIC("public"),
    PRIVATE("private");

    private final String value;

    ProfileVisibility(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static ProfileVisibility fromValue(String value) {
        for (ProfileVisibility visibility : values()) {
            if (visibility.value.equalsIgnoreCase(value)) {
                return visibility;
            }
        }
        throw new IllegalArgumentException("Valor de visibilidade inválido: " + value);
    }
}
