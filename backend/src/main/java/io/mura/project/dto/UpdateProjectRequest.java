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
        @NotBlank(message = "{validation.project.nameRequired}")
        @Size(max = 255, message = "{validation.project.nameTooLong}")
        String name,

        @Size(max = 2000, message = "{validation.description.tooLong}")
        String description,

        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "{validation.color.pattern}")
        String color,

        @NotNull(message = "{validation.project.typeRequired}")
        UUID typeId,

        LocalDate startDate,

        @NotNull(message = "{validation.status.required}")
        ProjectStatus status
) {}
