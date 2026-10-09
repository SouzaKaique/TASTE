package com.taste.backend.social.dto;

import java.time.Instant;
import java.util.List;

/** Item do feed social: uma experiencia de um amigo (ou propria) com curtidas e comentarios. */
public record FeedItemResponse(
        Long id,
        String type,
        UserSummaryResponse user,
        Instant createdAt,
        Long experienceId,
        String dishName,
        String restaurantName,
        String city,
        Integer rating,
        String photoUrl,
        String text,
        long likesCount,
        boolean likedByMe,
        List<FeedCommentResponse> comments
) {
}
