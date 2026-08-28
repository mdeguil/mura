package io.mura.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Le nom d'utilisateur est requis.")
        @Size(min = 3, max = 50, message = "Le nom d'utilisateur doit contenir entre 3 et 50 caractères.")
        String username,

        @NotBlank(message = "L'email est requis.")
        @Email(message = "L'email n'est pas valide.")
        String email,

        @NotBlank(message = "Le mot de passe est requis.")
        @Size(min = 8, message = "Le mot de passe doit contenir au moins 8 caractères.")
        String password
) {}
