package io.mura.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Changing the language the account reads Mura in.
 *
 * @param language {@code fr} or {@code en}
 */
public record ChangeLanguageRequest(
        @NotBlank(message = "{error.auth.badLanguage}")
        @Pattern(regexp = "^(fr|en)$", message = "{error.auth.badLanguage}")
        String language
) {
}
