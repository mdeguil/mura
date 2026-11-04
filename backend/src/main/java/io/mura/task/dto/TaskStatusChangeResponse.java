package io.mura.task.dto;

import io.mura.task.TaskStatus;
import io.mura.task.TaskStatusChange;

import java.time.Instant;
import java.util.UUID;

/**
 * One step in a task's history.
 *
 * @param id the step's id
 * @param fromStatus the status it left, or null for the task's creation
 * @param toStatus the status it reached
 * @param changedAt when
 */
public record TaskStatusChangeResponse(
        UUID id,
        TaskStatus fromStatus,
        TaskStatus toStatus,
        Instant changedAt
) {
    /**
     * Reads a step of the history.
     *
     * @param change the step
     * @return it as the client sees it
     */
    public static TaskStatusChangeResponse from(TaskStatusChange change) {
        return new TaskStatusChangeResponse(
                change.getId(),
                change.getFromStatus(),
                change.getToStatus(),
                change.getChangedAt()
        );
    }
}
