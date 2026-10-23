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

// Creating, renaming, handing over and removing. There is deliberately no
// endpoint here for members: that is the gérant's list.
@RestController
@RequestMapping("/api/admin/groups")
@RequiredArgsConstructor
public class AdminGroupController {

    private final AdminGroupService adminGroupService;
    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<List<AdminGroupResponse>> list(@AuthenticationPrincipal UUID userId) {
        accountService.requireAdmin(userId);
        return ResponseEntity.ok(adminGroupService.list());
    }

    @PostMapping
    public ResponseEntity<AdminGroupResponse> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody SaveAdminGroupRequest request
    ) {
        accountService.requireAdmin(userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(adminGroupService.create(userId, request));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<AdminGroupResponse> update(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId,
            @Valid @RequestBody SaveAdminGroupRequest request
    ) {
        accountService.requireAdmin(userId);
        return ResponseEntity.ok(adminGroupService.update(userId, groupId, request));
    }

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
