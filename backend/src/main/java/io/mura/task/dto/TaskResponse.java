package io.mura.task.dto;

import io.mura.member.dto.UserResponse;
import io.mura.task.Task;
import io.mura.task.TaskStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * A task, with everything the board, the planning and the detail panel
 * show.
 *
 * @param id the task's id
 * @param name its name
 * @param description its description, or null
 * @param status where it stands
 * @param startDate its first day
 * @param endDate its last day
 * @param archived whether it is archived
 * @param assignee who is in charge, or null
 * @param subtasks its subtasks, oldest first
 * @param statusHistory its status changes, oldest first, the creation
 *        included
 */
public record TaskResponse(
        UUID id,
        String name,
        String description,
        TaskStatus status,
        LocalDate startDate,
        LocalDate endDate,
        boolean archived,
        UserResponse assignee,
        List<SubtaskResponse> subtasks,
        List<TaskStatusChangeResponse> statusHistory
) {
    /**
     * Reads a task with its subtasks and history.
     *
     * @param task the task
     * @return it as the client sees it
     */
    public static TaskResponse from(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getName(),
                task.getDescription(),
                task.getStatus(),
                task.getStartDate(),
                task.getEndDate(),
                task.isArchived(),
                task.getAssignee() == null ? null : UserResponse.from(task.getAssignee()),
                task.getSubtasks().stream().map(SubtaskResponse::from).toList(),
                task.getStatusHistory().stream().map(TaskStatusChangeResponse::from).toList()
        );
    }
}
