package io.mura.admin.dto;

import jakarta.validation.constraints.NotNull;

public record SuspendAccountRequest(
        @NotNull(message = "Indique si le compte doit être suspendu.")
        Boolean suspended
) {}
