package io.mura.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(
        @NotBlank(message = "L'email est requis.")
        @Email(message = "L'email n'est pas valide.")
        String email
) {
    public ForgotPasswordRequest {
        email = email == null ? null : email.trim();
    }
}
