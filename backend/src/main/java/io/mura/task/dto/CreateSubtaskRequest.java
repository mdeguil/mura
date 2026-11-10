package io.mura.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Adding a subtask to a task.
 *
 * @param name up to 255 characters
 */
public record CreateSubtaskRequest(
        @NotBlank(message = "{validation.subtask.nameRequired}")
        @Size(max = 255, message = "{validation.subtask.nameTooLong}")
        String name
) {}
