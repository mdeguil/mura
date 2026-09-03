package io.mura.project;

import io.mura.project.dto.CreateProjectRequest;
import io.mura.project.dto.ProjectResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(projectService.listForUser(userId));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody CreateProjectRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(userId, request));
    }
}
