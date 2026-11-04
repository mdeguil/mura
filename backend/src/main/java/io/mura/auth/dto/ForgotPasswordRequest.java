package io.mura.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Asking for a password-reset link.
 *
 * @param email the account's address, trimmed
 */
public record ForgotPasswordRequest(
        @NotBlank(message = "L'email est requis.")
        @Email(message = "L'email n'est pas valide.")
        String email
) {
    /** Trims the address before the constraints judge it. */
    public ForgotPasswordRequest {
        email = email == null ? null : email.trim();
    }
}
