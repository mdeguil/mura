package io.mura.task.dto;

import io.mura.task.Subtask;

import java.util.UUID;

public record SubtaskResponse(
        UUID id,
        String name,
        boolean done
) {
    public static SubtaskResponse from(Subtask subtask) {
        return new SubtaskResponse(subtask.getId(), subtask.getName(), subtask.isDone());
    }
}
