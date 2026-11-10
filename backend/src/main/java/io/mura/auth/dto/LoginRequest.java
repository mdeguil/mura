package io.mura.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Signing in.
 *
 * @param email the account's address, in any case, trimmed
 * @param password the password, exactly as typed
 */
public record LoginRequest(
        @NotBlank(message = "{validation.email.required}")
        @Email(message = "{validation.email.invalid}")
        String email,

        @NotBlank(message = "{validation.password.required}")
        String password
) {
    /**
     * Trims the address, for the same reason as {@link RegisterRequest}: a
     * trailing space from a paste or from a phone keyboard is not a typo
     * worth refusing a sign-in for. The lookup itself ignores case, so there
     * is nothing to lowercase here.
     */
    public LoginRequest {
        email = email == null ? null : email.trim();
    }
}
