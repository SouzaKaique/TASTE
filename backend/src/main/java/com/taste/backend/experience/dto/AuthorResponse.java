package com.taste.backend.experience.dto;

import com.taste.backend.user.User;

public record AuthorResponse(Long id, String displayName, String username, String avatarUrl) {
    public static AuthorResponse of(User user) {
        return new AuthorResponse(user.getId(), user.getDisplayName(), user.getUsername(), user.getAvatarUrl());
    }
}
