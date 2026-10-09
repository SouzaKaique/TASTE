package com.taste.backend.social.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(
        @NotBlank(message = "escreva um comentário")
        @Size(max = 500, message = "o comentário pode ter até 500 caracteres")
        String text
) {
}
