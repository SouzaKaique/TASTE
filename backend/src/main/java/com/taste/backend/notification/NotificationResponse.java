package com.taste.backend.notification;

import com.taste.backend.experience.dto.AuthorResponse;

import java.time.Instant;

/** type: "friend-request" | "friend-accepted" | "like" | "comment". */
public record NotificationResponse(
        Long id,
        String type,
        AuthorResponse actor,
        Long experienceId,
        String dishName,
        String snippet,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse of(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getType().name().toLowerCase().replace('_', '-'),
                AuthorResponse.of(n.getActor()),
                n.getExperience() == null ? null : n.getExperience().getId(),
                n.getExperience() == null ? null : n.getExperience().getDishName(),
                n.getSnippet(),
                n.isRead(),
                n.getCreatedAt());
    }
}
