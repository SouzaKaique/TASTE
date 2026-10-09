package com.taste.backend.social.dto;

import java.time.Instant;

public record FeedCommentResponse(
        Long id,
        Long userId,
        String userDisplayName,
        String userAvatarUrl,
        String text,
        Instant createdAt
) {
}
