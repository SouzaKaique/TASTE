package com.taste.backend.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "informe o nome de exibição")
        @Size(min = 2, max = 80)
        String displayName,

        @NotBlank(message = "informe um username")
        @Pattern(regexp = "^[a-z0-9._]{3,20}$", message = "use de 3 a 20 letras minúsculas, números, pontos ou underline")
        String username,

        @NotBlank(message = "informe um e-mail")
        @Email(message = "informe um e-mail válido")
        String email,

        @NotBlank(message = "informe uma senha")
        @Size(min = 6, max = 72, message = "a senha deve ter ao menos 6 caracteres")
        String password
) {
}
