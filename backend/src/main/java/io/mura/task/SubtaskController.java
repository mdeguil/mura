package io.mura.task;

import io.mura.task.dto.CreateSubtaskRequest;
import io.mura.task.dto.SubtaskResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * A task's subtasks, under
 * {@code /api/projects/{projectId}/tasks/{taskId}/subtasks}. Any member of
 * the project may use them.
 */
@RestController
@RequestMapping("/api/projects/{projectId}/tasks/{taskId}/subtasks")
@RequiredArgsConstructor
public class SubtaskController {

    private final SubtaskService subtaskService;

    /**
     * {@code POST .../subtasks}: adds a subtask, not ticked off.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @param taskId the task
     * @param request the subtask's name
     * @return 201 with the subtask
     */
    @PostMapping
    public ResponseEntity<SubtaskResponse> create(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateSubtaskRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subtaskService.create(userId, projectId, taskId, request));
    }

    /**
     * {@code PATCH .../subtasks/{subtaskId}/toggle}: ticks a subtask off, or
     * reopens it.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @param taskId the task
     * @param subtaskId the subtask
     * @return 200 with the subtask
     */
    @PatchMapping("/{subtaskId}/toggle")
    public ResponseEntity<SubtaskResponse> toggle(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @PathVariable UUID subtaskId
    ) {
        return ResponseEntity.ok(subtaskService.toggle(userId, projectId, taskId, subtaskId));
    }

    /**
     * {@code DELETE .../subtasks/{subtaskId}}: deletes a subtask.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @param taskId the task
     * @param subtaskId the subtask
     * @return 204
     */
    @DeleteMapping("/{subtaskId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @PathVariable UUID subtaskId
    ) {
        subtaskService.delete(userId, projectId, taskId, subtaskId);
        return ResponseEntity.noContent().build();
    }
}
