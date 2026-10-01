package io.mura.task.dto;

import io.mura.task.TaskStatus;
import io.mura.task.TaskStatusChange;

import java.time.Instant;
import java.util.UUID;

public record TaskStatusChangeResponse(
        UUID id,
        TaskStatus fromStatus,
        TaskStatus toStatus,
        Instant changedAt
) {
    public static TaskStatusChangeResponse from(TaskStatusChange change) {
        return new TaskStatusChangeResponse(
                change.getId(),
                change.getFromStatus(),
                change.getToStatus(),
                change.getChangedAt()
        );
    }
}
