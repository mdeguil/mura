package io.mura.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSubtaskRequest(
        @NotBlank(message = "Le nom de la sous-tâche est requis.")
        @Size(max = 255, message = "Le nom de la sous-tâche ne doit pas dépasser 255 caractères.")
        String name
) {}
