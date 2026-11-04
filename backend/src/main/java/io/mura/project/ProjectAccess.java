package io.mura.project;

/**
 * How much of a project the caller may see: a member works on it, while
 * someone merely invited can read its description and decide.
 */
public enum ProjectAccess {
    /** On the team: the tasks, the planning and the invitations sent. */
    MEMBER,
    /** Holding a pending invitation: the description and the team only. */
    INVITED
}
