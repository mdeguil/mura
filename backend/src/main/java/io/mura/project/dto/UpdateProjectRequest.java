package io.mura.project.dto;

import io.mura.project.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Editing a project. It replaces every field, so the client resends what
 * it does not change.
 *
 * @param name up to 255 characters
 * @param description up to 2000 characters, or null
 * @param color {@code #rrggbb}, or null for the default
 * @param typeId the project type
 * @param startDate when it starts, or null
 * @param status where its work stands
 */
public record UpdateProjectRequest(
        @NotBlank(message = "Le nom du projet est requis.")
        @Size(max = 255, message = "Le nom du projet ne doit pas dépasser 255 caractères.")
        String name,

        @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères.")
        String description,

        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "La couleur doit être un code hexadécimal (ex: #14b8a6).")
        String color,

        @NotNull(message = "Le type de projet est requis.")
        UUID typeId,

        LocalDate startDate,

        @NotNull(message = "Le statut est requis.")
        ProjectStatus status
) {}
