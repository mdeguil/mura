package io.mura.admin.dto;

import io.mura.member.AccountRole;
import jakarta.validation.constraints.NotNull;

public record ChangeAccountRoleRequest(
        @NotNull(message = "Le rôle est requis.")
        AccountRole accountRole
) {}
