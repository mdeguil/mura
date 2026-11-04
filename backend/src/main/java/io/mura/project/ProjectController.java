package io.mura.project;

import io.mura.project.dto.AddGroupRequest;
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

/**
 * Projects and their teams, under {@code /api/projects}. Who may do what is
 * decided in {@link ProjectService}: any member reads, the owner and admins
 * run the team, and some things stay with the owner alone.
 */
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    /**
     * {@code GET /api/projects}: the reader's active projects.
     *
     * @param userId the signed-in account
     * @return 200 with the projects, newest first, each with its team
     */
    @GetMapping
    public ResponseEntity<List<ProjectResponse>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(projectService.listForUser(userId));
    }

    /**
     * {@code GET /api/projects/{id}}: one project, for a member or for
     * someone holding a pending invitation to it.
     *
     * @param userId the signed-in account
     * @param id the project
     * @return 200 with the project
     * @see ProjectService#getForUser(UUID, UUID)
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> get(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(projectService.getForUser(userId, id));
    }

    /**
     * {@code POST /api/projects}: creates a project, with the reader as its
     * owner.
     *
     * @param userId the signed-in account
     * @param request the project, and who to invite or bring on
     * @return 201 with the project
     * @see ProjectService#create(UUID, CreateProjectRequest)
     */
    @PostMapping
    public ResponseEntity<ProjectResponse> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody CreateProjectRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(userId, request));
    }

    /**
     * {@code GET /api/projects/archived}: the reader's bin -- the archived
     * projects they own.
     *
     * @param userId the signed-in account
     * @return 200 with the archived projects, without their teams
     */
    @GetMapping("/archived")
    public ResponseEntity<List<ProjectResponse>> listArchived(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(projectService.listArchivedForUser(userId));
    }

    /**
     * {@code PUT /api/projects/{id}}: edits a project, replacing every field.
     *
     * @param userId the signed-in account
     * @param id the project
     * @param request the project's new details
     * @return 200 with the project
     * @see ProjectService#update(UUID, UUID, UpdateProjectRequest)
     */
    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> update(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProjectRequest request
    ) {
        return ResponseEntity.ok(projectService.update(userId, id, request));
    }

    /**
     * {@code PATCH /api/projects/{id}/archive}: puts a project in the bin.
     *
     * @param userId the signed-in account
     * @param id the project
     * @return 200 with the project, archived
     * @see ProjectService#archive(UUID, UUID)
     */
    @PatchMapping("/{id}/archive")
    public ResponseEntity<ProjectResponse> archive(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(projectService.archive(userId, id));
    }

    /**
     * {@code PATCH /api/projects/{id}/restore}: takes a project out of the
     * bin.
     *
     * @param userId the signed-in account
     * @param id the project
     * @return 200 with the project and its team
     * @see ProjectService#restore(UUID, UUID)
     */
    @PatchMapping("/{id}/restore")
    public ResponseEntity<ProjectResponse> restore(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(projectService.restore(userId, id));
    }

    /**
     * {@code DELETE /api/projects/{id}}: deletes an archived project for
     * good.
     *
     * @param userId the signed-in account
     * @param id the project
     * @return 204
     * @see ProjectService#delete(UUID, UUID)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        projectService.delete(userId, id);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code GET /api/projects/{id}/members}: a project's team.
     *
     * @param userId the signed-in account
     * @param id the project
     * @return 200 with the members, owner first
     * @see ProjectService#listMembers(UUID, UUID)
     */
    @GetMapping("/{id}/members")
    public ResponseEntity<List<MemberResponse>> listMembers(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(projectService.listMembers(userId, id));
    }

    /**
     * {@code PATCH /api/projects/{id}/members/{memberId}/role}: makes a
     * member an admin, or a plain member again.
     *
     * @param userId the signed-in account
     * @param id the project
     * @param memberId the member
     * @param request the new role
     * @return 200 with the member
     * @see ProjectService#changeRole(UUID, UUID, UUID, ProjectRole)
     */
    @PatchMapping("/{id}/members/{memberId}/role")
    public ResponseEntity<MemberResponse> changeRole(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @PathVariable UUID memberId,
            @Valid @RequestBody ChangeRoleRequest request
    ) {
        return ResponseEntity.ok(projectService.changeRole(userId, id, memberId, request.role()));
    }

    /**
     * {@code POST /api/projects/{id}/members/{memberId}/transfer-ownership}:
     * hands the project over to another member.
     *
     * @param userId the signed-in account
     * @param id the project
     * @param memberId the new owner
     * @return 200 with the team, roles updated
     * @see ProjectService#transferOwnership(UUID, UUID, UUID)
     */
    @PostMapping("/{id}/members/{memberId}/transfer-ownership")
    public ResponseEntity<List<MemberResponse>> transferOwnership(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @PathVariable UUID memberId
    ) {
        return ResponseEntity.ok(projectService.transferOwnership(userId, id, memberId));
    }

    /**
     * {@code POST /api/projects/{id}/members/from-group}: brings a group's
     * people straight onto the team.
     *
     * @param userId the signed-in account
     * @param id the project
     * @param request the group
     * @return 200 with the team, newcomers included
     * @see ProjectService#addFromGroup(UUID, UUID, UUID)
     */
    @PostMapping("/{id}/members/from-group")
    public ResponseEntity<List<MemberResponse>> addFromGroup(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID id,
            @Valid @RequestBody AddGroupRequest request
    ) {
        return ResponseEntity.ok(
                projectService.addFromGroup(userId, id, request.groupId()));
    }

    /**
     * {@code POST /api/projects/{id}/members/{memberId}/remove}: takes
     * someone off the team, or lets the reader leave when the member is
     * them. A POST rather than a DELETE, because it carries an optional
     * message.
     *
     * @param userId the signed-in account
     * @param id the project
     * @param memberId the member
     * @param request the optional message, or no body at all
     * @return 204
     * @see ProjectService#removeMember(UUID, UUID, UUID, String)
     */
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
