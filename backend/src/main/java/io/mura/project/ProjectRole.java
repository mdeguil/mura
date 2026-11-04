package io.mura.project;

/**
 * What someone may do inside one project. Ordered from most to least able,
 * which is also the order a team list reads in. Not to be confused with
 * {@link io.mura.member.AccountRole}, which is about the whole application.
 */
public enum ProjectRole {
    /**
     * Runs the project. Unique per project, and only changes by transfer;
     * the only one who changes roles, archives or deletes the project.
     */
    OWNER,
    /** Runs the team with the owner: edits the project, invites, removes members. */
    ADMIN,
    /** Works on the tasks. */
    MEMBER;

    /**
     * Whether this role runs the team: editing the project, inviting,
     * bringing a group, removing members.
     *
     * @return true for {@link #OWNER} and {@link #ADMIN}
     */
    public boolean manages() {
        return this == OWNER || this == ADMIN;
    }
}
