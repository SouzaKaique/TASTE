package com.taste.backend.experience.dto;

public record OptionalCriteriaResponse(
        Integer flavor,
        Integer presentation,
        Integer texture,
        Integer creativity,
        Integer experience
) {
    public static OptionalCriteriaResponse from(Integer flavor, Integer presentation, Integer texture,
                                                 Integer creativity, Integer experience) {
        if (flavor == null && presentation == null && texture == null && creativity == null && experience == null) {
            return null;
        }
        return new OptionalCriteriaResponse(flavor, presentation, texture, creativity, experience);
    }
}
