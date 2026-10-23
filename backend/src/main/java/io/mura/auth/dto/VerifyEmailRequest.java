package io.mura.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyEmailRequest(
        @NotBlank(message = "Le code est requis.")
        @Pattern(regexp = "^\\d{6}$", message = "Le code fait 6 chiffres.")
        String code
) {
    public VerifyEmailRequest {
        code = code == null ? null : code.trim();
    }
}
