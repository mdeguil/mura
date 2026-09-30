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

@RestController
@RequestMapping("/api/projects/{projectId}/tasks/{taskId}/subtasks")
@RequiredArgsConstructor
public class SubtaskController {

    private final SubtaskService subtaskService;

    @PostMapping
    public ResponseEntity<SubtaskResponse> create(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateSubtaskRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(subtaskService.create(userId, projectId, taskId, request));
    }

    @PatchMapping("/{subtaskId}/toggle")
    public ResponseEntity<SubtaskResponse> toggle(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @PathVariable UUID taskId,
            @PathVariable UUID subtaskId
    ) {
        return ResponseEntity.ok(subtaskService.toggle(userId, projectId, taskId, subtaskId));
    }

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
