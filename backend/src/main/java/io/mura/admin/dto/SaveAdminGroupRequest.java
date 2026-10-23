package io.mura.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SaveAdminGroupRequest(
        @NotBlank(message = "Le nom du groupe est requis.")
        @Size(max = 100, message = "Le nom ne peut pas dépasser 100 caractères.")
        String name,

        @NotNull(message = "Choisis un gérant.")
        UUID managerId
) {
    public SaveAdminGroupRequest {
        name = name == null ? null : name.trim();
    }
}
