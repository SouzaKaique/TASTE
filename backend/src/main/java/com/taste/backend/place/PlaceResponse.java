package com.taste.backend.place;

import java.util.List;

/**
 * Restaurante vindo do OpenStreetMap. O id tem o formato "osm-N123" (N = node,
 * W = way, R = relation) e e o mesmo usado em Experience.restaurantId.
 */
public record PlaceResponse(
        String id,
        String name,
        String address,
        String district,
        String city,
        String state,
        String country,
        List<String> cuisineTypes,
        String website,
        String phone,
        String openingHours,
        Double lat,
        Double lon
) {
}
