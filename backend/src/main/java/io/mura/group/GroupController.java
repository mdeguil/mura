package io.mura.group;

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

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class GroupController {

    private final GroupService groupService;

    @GetMapping
    public ResponseEntity<List<GroupResponse>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(groupService.listForUser(userId));
    }

    // One group, for its own page. Any member may read it; what they can do
    // with it is decided by the owned flag it carries back.
    @GetMapping("/{groupId}")
    public ResponseEntity<GroupResponse> get(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId
    ) {
        return ResponseEntity.ok(groupService.get(userId, groupId));
    }

    @PostMapping
    public ResponseEntity<GroupResponse> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody SaveGroupRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.create(userId, request));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<GroupResponse> rename(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId,
            @Valid @RequestBody SaveGroupRequest request
    ) {
        return ResponseEntity.ok(groupService.rename(userId, groupId, request));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId
    ) {
        groupService.delete(userId, groupId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{groupId}/members")
    public ResponseEntity<GroupResponse> addMember(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID groupId,
            @Valid @RequestBody AddGroupMemberRequest request
    ) {
        return ResponseEntity.ok(groupService.addMember(userId, groupId, request));
    }

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
