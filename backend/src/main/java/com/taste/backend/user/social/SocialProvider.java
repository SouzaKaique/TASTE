package com.taste.backend.user.social;

import com.taste.backend.common.NotFoundException;

import java.util.Locale;

public enum SocialProvider {
    GOOGLE, APPLE;

    public static SocialProvider fromPath(String value) {
        try {
            return valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new NotFoundException("Provedor de login desconhecido.");
        }
    }

    public String path() {
        return name().toLowerCase(Locale.ROOT);
    }
}
