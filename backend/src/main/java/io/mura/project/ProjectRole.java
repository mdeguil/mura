package io.mura.project;

// Ordered from most to least able, which is also the order a team list
// reads in. The owner is unique per project and only changes by transfer.
public enum ProjectRole {
    OWNER,
    ADMIN,
    MEMBER;

    public boolean manages() {
        return this == OWNER || this == ADMIN;
    }
}
