package io.mura.group;

import io.mura.common.exception.ApiException;
import io.mura.group.dto.AddGroupMemberRequest;
import io.mura.group.dto.GroupResponse;
import io.mura.group.dto.HoldGroupMemberRequest;
import io.mura.group.dto.SaveGroupRequest;
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

/**
 * Groups as their members see them, under {@code /api/groups}. Reading is
 * open to any member; changing a group is the gérant's, and the rules are in
 * {@link GroupService}. Creating one is an administrator's job, under
 * {@code /api/admin/groups}.
 */
@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    /**
     * {@code GET /api/groups}: the groups the reader belongs to.
     *
     * @param userId the signed-in account
     * @return 200 with the groups and their members
     */
    @GetMapping
    public ResponseEntity<List<GroupResponse>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(groupService.listForUser(userId));
    }

    /**
     * {@code GET /api/groups/{groupId}}: one group, for its own page. Any
     * member may read it; what they can do with it is decided by the
     * {@code owned} flag it carries back.
     *
     * @param userId the signed-in account
     * @param groupId the group
     * @return 200 with the group
     * @see GroupService#get(UUID, UUID)
     */
    @GetMapping("/{groupId}")
    public ResponseEntity<GroupResponse> get(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId
    ) {
        return ResponseEntity.ok(groupService.get(userId, groupId));
    }

    /**
     * {@code POST /api/groups}: always refused. Only an administrator
     * creates a group, from {@code /api/admin/groups}, and names who runs
     * it. Answered here rather than left unmapped, so a client still trying
     * gets a reason instead of a server error.
     *
     * @return never returns
     * @throws ApiException 403, always
     */
    @PostMapping
    public ResponseEntity<Void> create() {
        throw new ApiException(HttpStatus.FORBIDDEN, "Seul un administrateur peut créer un groupe.");
    }

    /**
     * {@code PUT /api/groups/{groupId}}: renames a group.
     *
     * @param userId the signed-in account
     * @param groupId the group
     * @param request the new name
     * @return 200 with the group
     * @see GroupService#rename(UUID, UUID, SaveGroupRequest)
     */
    @PutMapping("/{groupId}")
    public ResponseEntity<GroupResponse> rename(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId,
            @Valid @RequestBody SaveGroupRequest request
    ) {
        return ResponseEntity.ok(groupService.rename(userId, groupId, request));
    }

    /**
     * {@code DELETE /api/groups/{groupId}}: deletes a group.
     *
     * @param userId the signed-in account
     * @param groupId the group
     * @return 204
     * @see GroupService#delete(UUID, UUID)
     */
    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId
    ) {
        groupService.delete(userId, groupId);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code POST /api/groups/{groupId}/members}: adds someone to a group.
     *
     * @param userId the signed-in account
     * @param groupId the group
     * @param request the address of the person to add
     * @return 200 with the group, member added
     * @see GroupService#addMember(UUID, UUID, AddGroupMemberRequest)
     */
    @PostMapping("/{groupId}/members")
    public ResponseEntity<GroupResponse> addMember(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId,
            @Valid @RequestBody AddGroupMemberRequest request
    ) {
        return ResponseEntity.ok(groupService.addMember(userId, groupId, request));
    }

    /**
     * {@code PUT /api/groups/{groupId}/members/{memberId}/hold}: sets a
     * member aside, or brings them back.
     *
     * @param userId the signed-in account
     * @param groupId the group
     * @param memberId the member
     * @param request whether they should be set aside
     * @return 200 with the group
     * @see GroupService#setMemberHold(UUID, UUID, UUID, boolean)
     */
    @PutMapping("/{groupId}/members/{memberId}/hold")
    public ResponseEntity<GroupResponse> setMemberHold(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId,
            @PathVariable UUID memberId,
            @Valid @RequestBody HoldGroupMemberRequest request
    ) {
        return ResponseEntity.ok(
                groupService.setMemberHold(userId, groupId, memberId, request.onHold()));
    }

    /**
     * {@code DELETE /api/groups/{groupId}/members/{memberId}}: takes someone
     * out of a group, or lets the reader leave it when the member is them.
     *
     * @param userId the signed-in account
     * @param groupId the group
     * @param memberId the member to take out
     * @return 204
     * @see GroupService#removeMember(UUID, UUID, UUID)
     */
    @DeleteMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId,
            @PathVariable UUID memberId
    ) {
        groupService.removeMember(userId, groupId, memberId);
        return ResponseEntity.noContent().build();
    }
}
