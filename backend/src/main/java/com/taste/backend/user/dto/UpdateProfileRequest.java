package com.taste.backend.user.dto;

import com.taste.backend.user.ProfileVisibility;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 2, max = 80)
        String displayName,

        @Size(max = 2000)
        String bio,

        @Size(max = 400_000, message = "a foto de perfil é grande demais")
        String avatarUrl,

        ProfileVisibility profileVisibility
) {
}
