package io.mura.auth.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Everything Mura holds about one person, as they download it (RGPD,
 * art. 15 and 20). Names rather than ids wherever another record is
 * mentioned: the file is meant to be read by the person and reused
 * elsewhere, not fed back into Mura.
 *
 * @param exportedAt when the file was put together
 * @param account the account itself
 * @param projects every project the person is on, archived ones included
 * @param assignedTasks the tasks they are responsible for
 * @param groups the groups they belong to
 * @param carnet the decisions they made in their carnet
 * @param contactRequestsReceived the carnet requests other people sent them
 * @param invitations project invitations, received and sent
 * @param notifications what their bell holds
 */
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
    /**
     * The account. The password is not here, even hashed: it is not
     * information about the person, and handing a hash out only helps
     * someone guess it.
     *
     * @param id the account's id
     * @param username its name
     * @param email its address
     * @param accountRole ADMIN or USER
     * @param createdAt when it was registered
     * @param emailVerifiedAt when its address was confirmed, or null
     * @param suspendedAt when it was suspended, or null
     * @param language the language it reads Mura in, {@code fr} or {@code en}
     */
    public record Account(
            UUID id,
            String username,
            String email,
            String accountRole,
            Instant createdAt,
            Instant emailVerifiedAt,
            Instant suspendedAt,
            String language
    ) {}

    /**
     * A project the person is on.
     *
     * @param name the project's name
     * @param description its description, or null
     * @param role the person's role in it
     * @param owner the owner's username
     * @param status where the project stands
     * @param startDate when it starts, or null
     * @param archived whether it is in the bin
     * @param joinedAt when the person joined it
     */
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

    /**
     * A task the person is responsible for.
     *
     * @param name the task's name
     * @param description its description, or null
     * @param project the name of its project
     * @param status where it stands
     * @param startDate its first day
     * @param endDate its last day
     * @param archived whether it is archived
     */
    public record TaskEntry(
            String name,
            String description,
            String project,
            String status,
            LocalDate startDate,
            LocalDate endDate,
            boolean archived
    ) {}

    /**
     * A group the person belongs to.
     *
     * @param name the group's name
     * @param manager its gérant's username
     * @param onHold whether the person is set aside in it
     * @param joinedAt when they were added
     */
    public record GroupEntry(String name, String manager, boolean onHold, Instant joinedAt) {}

    /**
     * A carnet entry, from either side.
     *
     * @param person the other person's username
     * @param status PENDING, ACCEPTED or DECLINED
     * @param favourite whether they are starred
     * @param hidden whether they were taken out of the carnet
     * @param since when the entry was created
     */
    public record ContactEntry(String person, String status, boolean favourite, boolean hidden, Instant since) {}

    /**
     * A project invitation.
     *
     * @param project the project's name
     * @param direction "RECEIVED" when the invitation was addressed to this
     *        person, "SENT" when they sent it
     * @param invitedUser the invitee's username
     * @param invitedBy the inviter's username
     * @param status where it stands
     * @param createdAt when it was sent
     * @param respondedAt when it was answered, or null
     */
    public record InvitationEntry(
            String project,
            String direction,
            String invitedUser,
            String invitedBy,
            String status,
            Instant createdAt,
            Instant respondedAt
    ) {}

    /**
     * A line in the person's bell.
     *
     * @param type what kind of news it is
     * @param about the project or group it concerns, by name, or null
     * @param from who caused it
     * @param message the note that came with it, or null
     * @param read whether it was read
     * @param createdAt when it arrived
     */
    public record NotificationEntry(
            String type,
            String about,
            String from,
            String message,
            boolean read,
            Instant createdAt
    ) {}
}
