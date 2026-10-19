package io.mura.project.dto;

import io.mura.member.dto.UserResponse;
import io.mura.project.InvitationStatus;
import io.mura.project.ProjectInvitation;

import java.time.Instant;
import java.util.UUID;

// Carries enough of the project for the invitee's home page to show what
// they are being invited to, without pulling in the full project payload.
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
        Instant createdAt
) {
    public static InvitationResponse from(ProjectInvitation invitation) {
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
                invitation.getCreatedAt()
        );
    }
}
