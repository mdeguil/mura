package io.mura.member;

// What someone may do to the application. Deliberately not ProjectRole:
// that one says what they may do inside a single project, and the two never
// stand in for each other. An application administrator holds no rights at
// all on a project they are not a member of.
public enum AccountRole {
    ADMIN,
    USER;

    public boolean administers() {
        return this == ADMIN;
    }
}
