package io.mura.admin.dto;

import io.mura.member.AccountRole;
import jakarta.validation.constraints.NotNull;

/**
 * Making an account an administrator, or a plain user again.
 *
 * @param accountRole ADMIN or USER
 */
public record ChangeAccountRoleRequest(
        @NotNull(message = "Le rôle est requis.")
        AccountRole accountRole
) {}
