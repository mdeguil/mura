package io.mura.notification;

public enum NotificationType {
    // You were removed from a project by someone who manages it.
    REMOVED_FROM_PROJECT,
    // Someone left a project you manage.
    MEMBER_LEFT_PROJECT,
    // Someone you work with had their account suspended. Sent to the owner
    // of each project and each group they belong to: those are the people
    // who have to work around the absence.
    MEMBER_SUSPENDED,
    // And the same person is allowed back in.
    MEMBER_RESTORED,
    // Their account is gone for good. On a project that was theirs, this
    // reaches whoever inherits it, and says so.
    MEMBER_DELETED,
    // Someone wants you in their carnet. About a person, so it carries
    // neither a project nor a group -- who it is about is the actor.
    CONTACT_REQUESTED,
    // And they said yes to yours.
    CONTACT_ACCEPTED
}
