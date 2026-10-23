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
    CONTACT_ACCEPTED,
    // A group is yours to run: an administrator created one and put you in
    // charge, or handed an existing one over to you.
    GROUP_ENTRUSTED,
    // The other side of a handover: a group you were running is now someone
    // else's. You stay a member of it.
    GROUP_MANAGER_CHANGED,
    // A group you belonged to is gone. Nothing happens to the people who
    // were in it, which is what the line says.
    GROUP_DELETED,
    // The gérant put you in one of their groups, or took you out of it.
    ADDED_TO_GROUP,
    REMOVED_FROM_GROUP,
    // Someone showed themselves out of a group you run.
    MEMBER_LEFT_GROUP,
    // Set aside inside the group, then brought back. Still a member either
    // way -- this is not account suspension and never means being locked
    // out of Mura.
    HELD_IN_GROUP,
    RESTORED_IN_GROUP
}
