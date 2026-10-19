package io.mura.project.dto;

import jakarta.validation.constraints.NotBlank;

// Either an email or a username: people know their teammates by one or the
// other, and matching both saves asking which one they typed.
public record CreateInvitationRequest(
        @NotBlank(message = "Indique l'email ou le pseudo de la personne à inviter.")
        String identifier
) {}
