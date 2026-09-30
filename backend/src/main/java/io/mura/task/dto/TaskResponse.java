package io.mura.task.dto;

import io.mura.task.Task;
import io.mura.task.TaskStatus;

import java.time.LocalDate;
import java.util.UUID;

public record TaskResponse(
        UUID id,
        String name,
        String description,
        TaskStatus status,
        LocalDate startDate,
        LocalDate endDate,
        boolean archived
) {
    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getName(),
                task.getDescription(),
                task.getStatus(),
                task.getStartDate(),
                task.getEndDate(),
                task.isArchived()
        );
    }
}
