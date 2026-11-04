package io.mura.admin;

import io.mura.admin.dto.AdminGroupResponse;
import io.mura.admin.dto.SaveAdminGroupRequest;
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
 * Groups, for administrators, under {@code /api/admin/groups}: creating,
 * renaming, handing over and removing. The listing shows who is in each
 * group, but there is deliberately no endpoint here that changes it: that
 * is the gérant's list. Every route answers 403 to anyone but an
 * administrator.
 */
@RestController
@RequestMapping("/api/admin/groups")
@RequiredArgsConstructor
public class AdminGroupController {

    private final AdminGroupService adminGroupService;
    private final AccountService accountService;

    /**
     * {@code GET /api/admin/groups}: every group on the instance.
     *
     * @param userId the signed-in administrator
     * @return 200 with the groups and their members, by name
     */
    @GetMapping
    public ResponseEntity<List<AdminGroupResponse>> list(@AuthenticationPrincipal UUID userId) {
        accountService.requireAdmin(userId);
        return ResponseEntity.ok(adminGroupService.list());
    }

    /**
     * {@code POST /api/admin/groups}: creates a group and names its gérant.
     *
     * @param userId the signed-in administrator
     * @param request the name and the gérant
     * @return 201 with the group
     * @see AdminGroupService#create(UUID, SaveAdminGroupRequest)
     */
    @PostMapping
    public ResponseEntity<AdminGroupResponse> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody SaveAdminGroupRequest request
    ) {
        accountService.requireAdmin(userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(adminGroupService.create(userId, request));
    }

    /**
     * {@code PUT /api/admin/groups/{groupId}}: renames a group, or hands it
     * to another gérant.
     *
     * @param userId the signed-in administrator
     * @param groupId the group
     * @param request the name and the gérant
     * @return 200 with the group
     * @see AdminGroupService#update(UUID, UUID, SaveAdminGroupRequest)
     */
    @PutMapping("/{groupId}")
    public ResponseEntity<AdminGroupResponse> update(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId,
            @Valid @RequestBody SaveAdminGroupRequest request
    ) {
        accountService.requireAdmin(userId);
        return ResponseEntity.ok(adminGroupService.update(userId, groupId, request));
    }

    /**
     * {@code DELETE /api/admin/groups/{groupId}}: deletes a group.
     *
     * @param userId the signed-in administrator
     * @param groupId the group
     * @return 204
     * @see AdminGroupService#delete(UUID, UUID)
     */
    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId
    ) {
        accountService.requireAdmin(userId);
        adminGroupService.delete(userId, groupId);
        return ResponseEntity.noContent().build();
    }
}
