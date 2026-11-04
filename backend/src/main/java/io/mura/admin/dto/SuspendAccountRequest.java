package io.mura.admin.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Suspending an account, or letting it back in. A flag rather than two
 * endpoints: the administrator sets the state they want.
 *
 * @param suspended true to suspend, false to restore
 */
public record SuspendAccountRequest(
        @NotNull(message = "Indique si le compte doit être suspendu.")
        Boolean suspended
) {}
