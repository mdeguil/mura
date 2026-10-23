package io.mura.auth.dto;

import io.mura.auth.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(
        @NotBlank(message = "Le lien est incomplet.")
        String token,

        @NotBlank(message = "Le mot de passe est requis.")
        @StrongPassword
        String password
) {}
