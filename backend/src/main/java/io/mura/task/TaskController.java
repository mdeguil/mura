package io.mura.task;

import io.mura.task.dto.CreateTaskRequest;
import io.mura.task.dto.TaskResponse;
import io.mura.task.dto.UpdateTaskRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * A project's tasks, under {@code /api/projects/{projectId}/tasks}. Every
 * member of the project may use them; the rules are in {@link TaskService}.
 */
@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    /**
     * {@code GET .../tasks}: the project's active tasks.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @return 200 with the tasks, by start date
     */
    @GetMapping
    public ResponseEntity<List<TaskResponse>> list(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(taskService.listForProject(userId, projectId));
    }

    /**
     * {@code GET .../tasks/archived}: the project's archived tasks.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @return 200 with the tasks, by start date
     */
    @GetMapping("/archived")
    public ResponseEntity<List<TaskResponse>> listArchived(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(taskService.listArchivedForProject(userId, projectId));
    }

    /**
     * {@code POST .../tasks}: creates a task.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @param request the task
     * @return 201 with the task
     * @see TaskService#create(UUID, UUID, CreateTaskRequest)
     */
    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(userId, projectId, request));
    }

    /**
     * {@code PUT .../tasks/{taskId}}: edits a task, replacing every field.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @param taskId the task
     * @param request the task's new state
     * @return 200 with the task
     * @see TaskService#update(UUID, UUID, UUID, UpdateTaskRequest)
     */
    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> update(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        return ResponseEntity.ok(taskService.update(userId, projectId, taskId, request));
    }

    /**
     * {@code PATCH .../tasks/{taskId}/archive}: archives a task.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @param taskId the task
     * @return 200 with the task, archived
     */
    @PatchMapping("/{taskId}/archive")
    public ResponseEntity<TaskResponse> archive(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId
    ) {
        return ResponseEntity.ok(taskService.archive(userId, projectId, taskId));
    }

    /**
     * {@code PATCH .../tasks/{taskId}/restore}: brings an archived task back.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @param taskId the task
     * @return 200 with the task
     */
    @PatchMapping("/{taskId}/restore")
    public ResponseEntity<TaskResponse> restore(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId
    ) {
        return ResponseEntity.ok(taskService.restore(userId, projectId, taskId));
    }

    /**
     * {@code DELETE .../tasks/{taskId}}: deletes an archived task for good.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @param taskId the task
     * @return 204
     * @see TaskService#delete(UUID, UUID, UUID)
     */
    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId
    ) {
        taskService.delete(userId, projectId, taskId);
        return ResponseEntity.noContent().build();
    }
}
