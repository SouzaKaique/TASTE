package com.taste.backend.experience.dto;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

public record ExperienceRequest(
        @NotBlank(message = "informe o nome do prato")
        String dishName,

        @NotBlank(message = "informe a categoria")
        String category,

        @NotBlank(message = "informe o tipo de culinária")
        String cuisineType,

        String restaurantId,

        @NotBlank(message = "informe o restaurante")
        String restaurantName,

        @NotBlank(message = "informe a cidade")
        String city,

        String country,

        @NotNull(message = "informe a data")
        LocalDate date,

        @NotNull @Min(1) @Max(5)
        Integer rating,

        @Size(max = 2_000_000, message = "a foto é grande demais")
        String photoUrl,

        @Size(max = 4000)
        String notes,

        List<String> tags,

        boolean favorite,

        @Pattern(regexp = "public|friends|private")
        String visibility,

        @Min(1) @Max(5) Integer flavor,
        @Min(1) @Max(5) Integer presentation,
        @Min(1) @Max(5) Integer texture,
        @Min(1) @Max(5) Integer creativity,
        @Min(1) @Max(5) Integer experienceCriteria
) {
}
