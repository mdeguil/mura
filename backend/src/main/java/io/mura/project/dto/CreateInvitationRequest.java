package io.mura.project.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateInvitationRequest(
        @NotBlank(message = "Indique l'email de la personne à inviter.")
        @Email(message = "Cet email n'est pas valide.")
        String email
) {}
