package io.mura.auth.dto;

import io.mura.auth.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Locale;

/**
 * Creating an account. The order of the fields is the order of the form:
 * when several are wrong, the first one here is the one reported.
 *
 * @param username 3 to 50 letters, digits, dots, dashes or underscores,
 *        starting with a letter or digit; trimmed
 * @param email the address, trimmed and lowercased
 * @param password the password, kept exactly as typed; see
 *        {@link StrongPassword}
 */
public record RegisterRequest(
        @NotBlank(message = "{validation.username.required}")
        @Size(min = 3, max = 50, message = "{validation.username.size}")
        @Pattern(
                regexp = "^[\\p{L}\\p{N}][\\p{L}\\p{N}._-]*$",
                message = "{validation.username.pattern}"
        )
        String username,

        @NotBlank(message = "{validation.email.required}")
        @Email(message = "{validation.email.invalid}")
        @Size(max = 255, message = "{validation.email.tooLong}")
        String email,

        @NotBlank(message = "{validation.password.required}")
        @StrongPassword
        String password
) {
    /**
     * Normalises the username and the address. Done here rather than in the
     * service, because this runs at deserialisation and the constraints run
     * after it: an address pasted with a trailing space would otherwise be
     * rejected as invalid rather than simply trimmed. The password is left
     * exactly as typed -- whitespace in a password is a character like any
     * other.
     */
    public RegisterRequest {
        username = username == null ? null : username.trim();
        email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
