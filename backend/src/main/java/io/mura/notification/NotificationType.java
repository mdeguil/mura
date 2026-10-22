package io.mura.notification;

public enum NotificationType {
    // You were removed from a project by someone who manages it.
    REMOVED_FROM_PROJECT,
    // Someone left a project you manage.
    MEMBER_LEFT_PROJECT,
    // Someone in a group you own had their account suspended. You own the
    // group, so you are the one who has to work around their absence.
    MEMBER_SUSPENDED,
    // And the same person is allowed back in.
    MEMBER_RESTORED;

    // Whether the notification is about a group rather than a project. The
    // two carry different subjects and read differently.
    public boolean aboutGroup() {
        return this == MEMBER_SUSPENDED || this == MEMBER_RESTORED;
    }
}
