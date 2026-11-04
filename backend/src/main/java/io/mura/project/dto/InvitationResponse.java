package io.mura.project.dto;

import io.mura.member.dto.UserResponse;
import io.mura.project.InvitationStatus;
import io.mura.project.ProjectInvitation;

import java.time.Instant;
import java.util.UUID;

/**
 * An invitation, with enough of the project for the invitee's home page to
 * show what they are being invited to, without pulling in the full project
 * payload.
 *
 * @param id the invitation's id
 * @param projectId the project
 * @param projectName its name
 * @param projectColor its colour, as {@code #rrggbb}
 * @param invitedUser who was invited
 * @param invitedBy who invited them
 * @param status where it stands
 * @param read whether the invitee has seen it in the bell
 * @param dismissed whether the invitee cleared it from the bell; it still
 *        waits in their projects list
 * @param createdAt when it was sent
 * @param expiresAt when it stops being answerable, shown so nobody is
 *        surprised by it
 */
public record InvitationResponse(
        UUID id,
        UUID projectId,
        String projectName,
        String projectColor,
        UserResponse invitedUser,
        UserResponse invitedBy,
        InvitationStatus status,
        boolean read,
        boolean dismissed,
        Instant createdAt,
        Instant expiresAt
) {
    /**
     * Reads an invitation with its project and both people loaded.
     *
     * @param invitation the invitation
     * @param expiresAt when it lapses, worked out by the service
     * @return the invitation as the client sees it
     */
    public static InvitationResponse from(ProjectInvitation invitation, Instant expiresAt) {
        return new InvitationResponse(
                invitation.getId(),
                invitation.getProject().getId(),
                invitation.getProject().getName(),
                invitation.getProject().getColor(),
                UserResponse.from(invitation.getInvitedUser()),
                UserResponse.from(invitation.getInvitedBy()),
                invitation.getStatus(),
                invitation.getReadAt() != null,
                invitation.getDismissedAt() != null,
                invitation.getCreatedAt(),
                expiresAt
        );
    }
}
