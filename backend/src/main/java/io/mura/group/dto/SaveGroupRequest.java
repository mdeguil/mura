package io.mura.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveGroupRequest(
        @NotBlank(message = "Le nom du groupe est requis.")
        @Size(max = 100, message = "Le nom du groupe ne doit pas dépasser 100 caractères.")
        String name
) {}
