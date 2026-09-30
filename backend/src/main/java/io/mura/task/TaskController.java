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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public ResponseEntity<List<TaskResponse>> list(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(taskService.listForProject(userId, projectId));
    }

    @PostMapping
    public ResponseEntity<TaskResponse> create(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(taskService.create(userId, projectId, request));
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<TaskResponse> update(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request
    ) {
        return ResponseEntity.ok(taskService.update(userId, projectId, taskId, request));
    }

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
