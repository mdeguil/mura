package io.mura.auth.dto;

import jakarta.validation.constraints.NotBlank;

// Closing one's own account takes the password: the deliberate step in
// front of something that cannot be undone, and a guard against a session
// left open on someone else's screen.
public record DeleteOwnAccountRequest(
        @NotBlank(message = "Saisis ton mot de passe pour confirmer.")
        String password
) {}
