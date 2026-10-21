package io.mura.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AddContactRequest(
        @NotBlank(message = "Indique l'email de la personne à ajouter.")
        @Email(message = "Cet email n'est pas valide.")
        String email
) {}
