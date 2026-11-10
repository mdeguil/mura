package io.mura.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * Creating a group, or renaming it and naming its gérant.
 *
 * @param name up to 100 characters, trimmed
 * @param managerId the account that runs it
 */
public record SaveAdminGroupRequest(
        @NotBlank(message = "{validation.group.nameRequired}")
        @Size(max = 100, message = "{validation.name.max100}")
        String name,

        @NotNull(message = "{validation.group.managerRequired}")
        UUID managerId
) {
    /** Trims the name before the constraints judge it. */
    public SaveAdminGroupRequest {
        name = name == null ? null : name.trim();
    }
}
