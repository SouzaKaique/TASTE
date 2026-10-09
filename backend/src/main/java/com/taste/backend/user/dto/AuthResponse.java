package com.taste.backend.user.dto;

public record AuthResponse(
        String token,
        UserResponse user
) {
}
