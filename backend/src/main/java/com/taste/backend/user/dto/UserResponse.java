package com.taste.backend.user.dto;

import com.taste.backend.user.ProfileVisibility;

import java.time.Instant;

public record UserResponse(
        Long id,
        String displayName,
        String username,
        String email,
        String avatarUrl,
        String bio,
        Instant createdAt,
        ProfileVisibility profileVisibility,
        UserStats stats,
        /** Situacao da amizade com quem esta vendo; null no proprio perfil. */
        String friendshipStatus
) {
}
