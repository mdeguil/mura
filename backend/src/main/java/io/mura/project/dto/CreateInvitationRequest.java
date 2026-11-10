package io.mura.project.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Inviting someone onto a project.
 *
 * @param email the address of their account
 */
public record CreateInvitationRequest(
        @NotBlank(message = "{validation.invite.emailRequired}")
        @Email(message = "{validation.email.thisInvalid}")
        String email
) {}
