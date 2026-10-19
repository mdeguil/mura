package io.mura.project;

import io.mura.project.dto.CreateInvitationRequest;
import io.mura.project.dto.InvitationResponse;
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

// Two audiences share one service: the project side (who has been invited,
// invite, cancel) and the invitee side (what am I invited to, answer).
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    @PostMapping("/projects/{projectId}/invitations")
    public ResponseEntity<InvitationResponse> invite(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateInvitationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invitationService.invite(userId, projectId, request));
    }

    @GetMapping("/projects/{projectId}/invitations")
    public ResponseEntity<List<InvitationResponse>> listForProject(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(invitationService.listPendingForProject(userId, projectId));
    }

    @DeleteMapping("/projects/{projectId}/invitations/{invitationId}")
    public ResponseEntity<Void> cancel(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @PathVariable UUID invitationId
    ) {
        invitationService.cancel(userId, projectId, invitationId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/invitations")
    public ResponseEntity<List<InvitationResponse>> listMine(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(invitationService.listPendingForUser(userId));
    }


    @PostMapping("/invitations/{invitationId}/read")
    public ResponseEntity<InvitationResponse> markRead(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID invitationId
    ) {
        return ResponseEntity.ok(invitationService.markRead(userId, invitationId));
    }

    @PostMapping("/invitations/{invitationId}/dismiss")
    public ResponseEntity<InvitationResponse> dismiss(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID invitationId
    ) {
        return ResponseEntity.ok(invitationService.dismiss(userId, invitationId));
    }
    @PostMapping("/invitations/{invitationId}/accept")
    public ResponseEntity<InvitationResponse> accept(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID invitationId
    ) {
        return ResponseEntity.ok(invitationService.accept(userId, invitationId));
    }

    @PostMapping("/invitations/{invitationId}/decline")
    public ResponseEntity<InvitationResponse> decline(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID invitationId
    ) {
        return ResponseEntity.ok(invitationService.decline(userId, invitationId));
    }
}
