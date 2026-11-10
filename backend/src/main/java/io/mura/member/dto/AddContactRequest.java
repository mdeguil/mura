package io.mura.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Asking someone to join one's carnet.
 *
 * @param email the address of their account
 */
public record AddContactRequest(
        @NotBlank(message = "{validation.member.emailRequired}")
        @Email(message = "{validation.email.thisInvalid}")
        String email
) {}
