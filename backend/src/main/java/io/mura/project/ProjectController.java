package io.mura.project;

import io.mura.project.dto.AddGroupMembersRequest;
import io.mura.project.dto.ChangeRoleRequest;
import io.mura.project.dto.CreateProjectRequest;
import io.mura.project.dto.MemberResponse;
import io.mura.project.dto.ProjectResponse;
import io.mura.project.dto.RemoveMemberRequest;
import io.mura.project.dto.UpdateProjectRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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


    @GetMapping("/archived")
    public ResponseEntity<List<ProjectResponse>> listArchived(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(projectService.listArchivedForUser(userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> update(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProjectRequest request
    ) {
        return ResponseEntity.ok(projectService.update(userId, id, request));
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<ProjectResponse> archive(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(projectService.archive(userId, id));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<ProjectResponse> restore(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(projectService.restore(userId, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        projectService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/{id}/members")
    public ResponseEntity<List<MemberResponse>> listMembers(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(projectService.listMembers(userId, id));
    }

    @PatchMapping("/{id}/members/{memberId}/role")
    public ResponseEntity<MemberResponse> changeRole(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @PathVariable UUID memberId,
            @Valid @RequestBody ChangeRoleRequest request
    ) {
        return ResponseEntity.ok(projectService.changeRole(userId, id, memberId, request.role()));
    }

    @PostMapping("/{id}/members/{memberId}/transfer-ownership")
    public ResponseEntity<List<MemberResponse>> transferOwnership(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @PathVariable UUID memberId
    ) {
        return ResponseEntity.ok(projectService.transferOwnership(userId, id, memberId));
    }

    @PostMapping("/{id}/members/from-group")
    public ResponseEntity<List<MemberResponse>> addFromGroup(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody AddGroupMembersRequest request
    ) {
        return ResponseEntity.ok(
                projectService.addFromGroup(userId, id, request.groupId(), request.memberIds()));
    }

    @PostMapping("/{id}/members/{memberId}/remove")
    public ResponseEntity<Void> removeMember(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @PathVariable UUID memberId,
            @Valid @RequestBody(required = false) RemoveMemberRequest request
    ) {
        projectService.removeMember(userId, id, memberId, request == null ? null : request.message());
        return ResponseEntity.noContent().build();
    }
}
