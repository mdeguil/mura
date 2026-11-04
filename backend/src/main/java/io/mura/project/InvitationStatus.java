package io.mura.project;

/** Where a {@link ProjectInvitation} stands. */
public enum InvitationStatus {
    /** Sent, not answered yet, and still within its window. */
    PENDING,
    /** Accepted: the invitee is on the team. */
    ACCEPTED,
    /** Refused. The invitee can be asked again; the new one replaces it. */
    DECLINED,
    /**
     * Went unanswered past its window. Set lazily, the first time anything
     * reads the invitation after the deadline, so expiry does not depend on
     * the application having been running.
     */
    EXPIRED
}
