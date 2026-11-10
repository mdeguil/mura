package io.mura.project.dto;

import io.mura.project.ProjectRole;
import jakarta.validation.constraints.NotNull;

/**
 * Changing a member's role. OWNER is refused here: handing the project over
 * is its own act, so that a project never ends up with two owners or none.
 *
 * @param role ADMIN or MEMBER
 */
public record ChangeRoleRequest(
        @NotNull(message = "{validation.role.required}")
        ProjectRole role
) {}
