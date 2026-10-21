package io.mura.project;

public enum InvitationStatus {
    PENDING,
    ACCEPTED,
    DECLINED,
    // Went unanswered past its window. Set lazily, the first time anything
    // reads the invitation after the deadline, so expiry does not depend on
    // the application having been running.
    EXPIRED
}
