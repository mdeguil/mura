package io.mura.task.dto;

import io.mura.task.Subtask;

import java.util.UUID;

/**
 * A subtask.
 *
 * @param id the subtask's id
 * @param name its name
 * @param done whether it is ticked off
 */
public record SubtaskResponse(
        UUID id,
        String name,
        boolean done
) {
    /**
     * Reads a subtask.
     *
     * @param subtask the subtask
     * @return it as the client sees it
     */
    public static SubtaskResponse from(Subtask subtask) {
        return new SubtaskResponse(subtask.getId(), subtask.getName(), subtask.isDone());
    }
}
