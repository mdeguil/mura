package io.mura.task.dto;

import io.mura.task.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateTaskRequest(
        @NotBlank(message = "Le nom de la tâche est requis.")
        @Size(max = 255, message = "Le nom de la tâche ne doit pas dépasser 255 caractères.")
        String name,

        @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères.")
        String description,

        @NotNull(message = "Le statut est requis.")
        TaskStatus status,

        @NotNull(message = "La date de début est requise.")
        LocalDate startDate,

        @NotNull(message = "La date de fin est requise.")
        LocalDate endDate,

        // Null unassigns the task. The service checks that anyone named here
        // is actually a member of the project.
        UUID assigneeId
) {}
