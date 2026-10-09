package com.taste.backend.user.dto;

public record UserStats(
        long totalExperiences,
        long totalRestaurants,
        long totalCities,
        long totalFavorites,
        double averageRating
) {
    public static UserStats empty() {
        return new UserStats(0, 0, 0, 0, 0);
    }
}
