package io.mura.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Asking someone to join one's carnet.
 *
 * @param email the address of their account
 */
public record AddContactRequest(
        @NotBlank(message = "Indique l'email de la personne à ajouter.")
        @Email(message = "Cet email n'est pas valide.")
        String email
) {}
