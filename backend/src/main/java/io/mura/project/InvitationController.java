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

/**
 * Invitations, for their two audiences sharing one service: the project
 * side, under {@code /api/projects/{projectId}/invitations} (who has been
 * invited, invite, cancel), and the invitee side, under
 * {@code /api/invitations} (what am I invited to, answer).
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class InvitationController {

    private final InvitationService invitationService;

    /**
     * {@code POST /api/projects/{projectId}/invitations}: invites someone.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @param request the invitee's address
     * @return 201 with the invitation
     * @see InvitationService#invite(UUID, UUID, CreateInvitationRequest)
     */
    @PostMapping("/projects/{projectId}/invitations")
    public ResponseEntity<InvitationResponse> invite(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateInvitationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(invitationService.invite(userId, projectId, request));
    }

    /**
     * {@code GET /api/projects/{projectId}/invitations}: the project's
     * invitations that did not end in a member.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @return 200 with the invitations
     * @see InvitationService#listOpenForProject(UUID, UUID)
     */
    @GetMapping("/projects/{projectId}/invitations")
    public ResponseEntity<List<InvitationResponse>> listForProject(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId
    ) {
        return ResponseEntity.ok(invitationService.listOpenForProject(userId, projectId));
    }

    /**
     * {@code DELETE /api/projects/{projectId}/invitations/{invitationId}}:
     * withdraws a pending invitation.
     *
     * @param userId the signed-in account
     * @param projectId the project
     * @param invitationId the invitation
     * @return 204
     * @see InvitationService#cancel(UUID, UUID, UUID)
     */
    @DeleteMapping("/projects/{projectId}/invitations/{invitationId}")
    public ResponseEntity<Void> cancel(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID projectId,
            @PathVariable UUID invitationId
    ) {
        invitationService.cancel(userId, projectId, invitationId);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code GET /api/invitations}: the invitations waiting on the reader.
     *
     * @param userId the signed-in account
     * @return 200 with the pending invitations
     * @see InvitationService#listPendingForUser(UUID)
     */
    @GetMapping("/invitations")
    public ResponseEntity<List<InvitationResponse>> listMine(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(invitationService.listPendingForUser(userId));
    }

    /**
     * {@code POST /api/invitations/{invitationId}/read}: marks one as read in
     * the bell.
     *
     * @param userId the signed-in account
     * @param invitationId the invitation
     * @return 200 with the invitation
     * @see InvitationService#markRead(UUID, UUID)
     */
    @PostMapping("/invitations/{invitationId}/read")
    public ResponseEntity<InvitationResponse> markRead(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID invitationId
    ) {
        return ResponseEntity.ok(invitationService.markRead(userId, invitationId));
    }

    /**
     * {@code POST /api/invitations/{invitationId}/dismiss}: clears one from
     * the bell; it still waits in the projects list.
     *
     * @param userId the signed-in account
     * @param invitationId the invitation
     * @return 200 with the invitation
     * @see InvitationService#dismiss(UUID, UUID)
     */
    @PostMapping("/invitations/{invitationId}/dismiss")
    public ResponseEntity<InvitationResponse> dismiss(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID invitationId
    ) {
        return ResponseEntity.ok(invitationService.dismiss(userId, invitationId));
    }

    /**
     * {@code POST /api/invitations/{invitationId}/accept}: joins the project.
     *
     * @param userId the signed-in account
     * @param invitationId the invitation
     * @return 200 with the invitation, accepted
     * @see InvitationService#accept(UUID, UUID)
     */
    @PostMapping("/invitations/{invitationId}/accept")
    public ResponseEntity<InvitationResponse> accept(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID invitationId
    ) {
        return ResponseEntity.ok(invitationService.accept(userId, invitationId));
    }

    /**
     * {@code POST /api/invitations/{invitationId}/decline}: turns the
     * invitation down.
     *
     * @param userId the signed-in account
     * @param invitationId the invitation
     * @return 200 with the invitation, declined
     * @see InvitationService#decline(UUID, UUID)
     */
    @PostMapping("/invitations/{invitationId}/decline")
    public ResponseEntity<InvitationResponse> decline(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID invitationId
    ) {
        return ResponseEntity.ok(invitationService.decline(userId, invitationId));
    }
}
