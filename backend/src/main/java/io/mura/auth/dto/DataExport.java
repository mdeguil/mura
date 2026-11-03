package io.mura.auth.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

// Everything Mura holds about one person, as they download it (RGPD,
// art. 15 and 20). Names rather than ids wherever another record is
// mentioned: the file is meant to be read by the person and reused
// elsewhere, not fed back into Mura.
public record DataExport(
        Instant exportedAt,
        Account account,
        List<ProjectEntry> projects,
        List<TaskEntry> assignedTasks,
        List<GroupEntry> groups,
        List<ContactEntry> carnet,
        List<ContactEntry> contactRequestsReceived,
        List<InvitationEntry> invitations,
        List<NotificationEntry> notifications
) {
    // The password is not here, even hashed: it is not information about
    // the person, and handing a hash out only helps someone guess it.
    public record Account(
            UUID id,
            String username,
            String email,
            String accountRole,
            Instant createdAt,
            Instant emailVerifiedAt,
            Instant suspendedAt
    ) {}

    public record ProjectEntry(
            String name,
            String description,
            String role,
            String owner,
            String status,
            LocalDate startDate,
            boolean archived,
            Instant joinedAt
    ) {}

    public record TaskEntry(
            String name,
            String description,
            String project,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            boolean archived
    ) {}

    public record GroupEntry(String name, String manager, boolean onHold, Instant joinedAt) {}

    public record ContactEntry(String person, String status, boolean favourite, boolean hidden, Instant since) {}

    // direction: "RECEIVED" when the invitation was addressed to this
    // person, "SENT" when it went out from a project they own.
    public record InvitationEntry(
            String project,
            String direction,
            String invitedUser,
            String invitedBy,
            String status,
            Instant createdAt,
            Instant respondedAt
    ) {}

    public record NotificationEntry(
            String type,
            String about,
            String from,
            String message,
            boolean read,
            Instant createdAt
    ) {}
}
