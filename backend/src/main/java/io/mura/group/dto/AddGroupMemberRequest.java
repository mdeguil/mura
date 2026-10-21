package io.mura.group.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AddGroupMemberRequest(
        @NotBlank(message = "Indique l'email de la personne à ajouter.")
        @Email(message = "Cet email n'est pas valide.")
        String email
) {}
