package io.mura.project;

import io.mura.project.dto.AddMemberRequest;
import io.mura.project.dto.CreateProjectRequest;
import io.mura.project.dto.MemberResponse;
import io.mura.project.dto.ProjectResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> get(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(projectService.getForUser(userId, id));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody CreateProjectRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(userId, request));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<MemberResponse>> listMembers(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(projectService.listMembers(userId, id));
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<MemberResponse> addMember(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody AddMemberRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.addMember(userId, id, request));
    }

    @DeleteMapping("/{id}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @PathVariable UUID memberId
    ) {
        projectService.removeMember(userId, id, memberId);
        return ResponseEntity.noContent().build();
    }
}
