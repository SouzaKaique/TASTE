package com.taste.backend.social.dto;

import com.taste.backend.user.User;

/**
 * Resumo de um usuario para listas (busca, amigos, feed).
 * friendshipStatus: "none" | "pending-sent" | "pending-received" | "friends" | "self".
 */
public record UserSummaryResponse(
        Long id,
        String displayName,
        String username,
        String avatarUrl,
        String friendshipStatus
) {
    public static UserSummaryResponse of(User user, String friendshipStatus) {
        return new UserSummaryResponse(user.getId(), user.getDisplayName(), user.getUsername(), user.getAvatarUrl(), friendshipStatus);
    }
}
