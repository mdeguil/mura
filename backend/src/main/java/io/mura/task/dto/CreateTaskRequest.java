package io.mura.task.dto;

import io.mura.task.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Creating a task.
 *
 * @param name up to 255 characters
 * @param description up to 2000 characters, or null
 * @param status where it starts, or null for {@link TaskStatus#A_FAIRE}
 * @param startDate its first day
 * @param endDate its last day
 * @param assigneeId who is in charge, or null for nobody yet; the service
 *        checks they are on the project's team
 */
public record CreateTaskRequest(
        @NotBlank(message = "{validation.task.nameRequired}")
        @Size(max = 255, message = "{validation.task.nameTooLong}")
        String name,

        @Size(max = 2000, message = "{validation.description.tooLong}")
        String description,

        TaskStatus status,

        @NotNull(message = "{validation.task.startRequired}")
        LocalDate startDate,

        @NotNull(message = "{validation.task.endRequired}")
        LocalDate endDate,

        UUID assigneeId
) {}
