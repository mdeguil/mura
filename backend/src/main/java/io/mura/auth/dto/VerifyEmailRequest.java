package io.mura.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Confirming the account's address.
 *
 * @param code the six digits that were mailed, trimmed
 */
public record VerifyEmailRequest(
        @NotBlank(message = "Le code est requis.")
        @Pattern(regexp = "^\\d{6}$", message = "Le code fait 6 chiffres.")
        String code
) {
    /** Trims the code before the constraints judge it. */
    public VerifyEmailRequest {
        code = code == null ? null : code.trim();
    }
}
