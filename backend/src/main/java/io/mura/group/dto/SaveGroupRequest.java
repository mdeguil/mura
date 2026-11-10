package io.mura.group.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Renaming a group.
 *
 * @param name the new name, up to 100 characters
 */
public record SaveGroupRequest(
        @NotBlank(message = "{validation.group.nameRequired}")
        @Size(max = 100, message = "{validation.group.nameTooLong}")
        String name
) {}
