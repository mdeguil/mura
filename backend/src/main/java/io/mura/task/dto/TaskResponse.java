package io.mura.task.dto;

import io.mura.member.dto.UserResponse;
import io.mura.task.Task;
import io.mura.task.TaskStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

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
