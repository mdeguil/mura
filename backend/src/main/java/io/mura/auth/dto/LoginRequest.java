package io.mura.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "L'email est requis.")
        @Email(message = "L'email n'est pas valide.")
        String email,

        @NotBlank(message = "Le mot de passe est requis.")
        String password
) {}
