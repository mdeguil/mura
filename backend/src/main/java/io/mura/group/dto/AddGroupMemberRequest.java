package io.mura.group.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Adding someone to a group.
 *
 * @param email the address of their account
 */
public record AddGroupMemberRequest(
        @NotBlank(message = "{validation.member.emailRequired}")
        @Email(message = "{validation.email.thisInvalid}")
        String email
) {}
