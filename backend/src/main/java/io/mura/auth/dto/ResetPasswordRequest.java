package io.mura.auth.dto;

import io.mura.auth.validation.StrongPassword;
import jakarta.validation.constraints.NotBlank;

/**
 * Choosing a new password from a reset link.
 *
 * @param token the token the link carried, {@code <id>.<secret>}
 * @param password the new password; see {@link StrongPassword}
 */
public record ResetPasswordRequest(
        @NotBlank(message = "{validation.link.incomplete}")
        String token,

        @NotBlank(message = "{validation.password.required}")
        @StrongPassword
        String password
) {}
