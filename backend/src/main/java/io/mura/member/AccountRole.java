package io.mura.member;

/**
 * What someone may do to the application. Deliberately not
 * {@link io.mura.project.ProjectRole}: that one says what they may do inside
 * a single project, and the two never stand in for each other. An
 * application administrator holds no rights at all on a project they are
 * not a member of.
 */
public enum AccountRole {
    /** Runs the instance: accounts, groups and project types. */
    ADMIN,
    /** Everyone else. */
    USER;

    /**
     * Whether this role opens the administration.
     *
     * @return true for {@link #ADMIN}
     */
    public boolean administers() {
        return this == ADMIN;
    }
}
