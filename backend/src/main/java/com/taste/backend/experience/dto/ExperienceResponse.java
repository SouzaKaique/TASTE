package com.taste.backend.experience.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ExperienceResponse(
        Long id,
        Long userId,
        String dishName,
        String category,
        String cuisineType,
        String restaurantId,
        String restaurantName,
        String city,
        String country,
        LocalDate date,
        Integer rating,
        List<PhotoResponse> photos,
        String notes,
        List<String> tags,
        boolean isFavorite,
        String visibility,
        OptionalCriteriaResponse optionalCriteria,
        Instant createdAt,
        Instant updatedAt
) {
}
