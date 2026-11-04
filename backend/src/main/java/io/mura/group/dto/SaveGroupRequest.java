package io.mura.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Renaming a group.
 *
 * @param name the new name, up to 100 characters
 */
public record SaveGroupRequest(
        @NotBlank(message = "Le nom du groupe est requis.")
        @Size(max = 100, message = "Le nom du groupe ne doit pas dépasser 100 caractères.")
        String name
) {}
