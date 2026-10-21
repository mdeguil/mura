package io.mura.project.dto;

import io.mura.project.ProjectRole;
import jakarta.validation.constraints.NotNull;

// OWNER is not settable here: handing the project over is its own act, so
// that a project never ends up with two owners or none.
public record ChangeRoleRequest(
        @NotNull(message = "Le rôle est requis.")
        ProjectRole role
) {}
