package io.mura.admin.dto;

import java.util.List;

/**
 * What deleting an account will actually do, worked out before anything is
 * done. Deletion is irreversible and reaches other people's work, so the
 * reader is shown the consequences by name rather than asked to trust a
 * warning.
 *
 * @param username the account to delete
 * @param projectsTransferred projects that outlive the account because
 *        somebody else is in them, each with the person who will inherit it
 * @param projectsDeleted projects nobody else belongs to, which go with the
 *        account
 * @param groupsDeleted the groups the account runs, which go with it
 * @param tasksUnassigned how many tasks stay where they are and simply lose
 *        their assignee
 */
public record AccountDeletionPreview(
        String username,
        List<ProjectHandover> projectsTransferred,
        List<String> projectsDeleted,
        List<String> groupsDeleted,
        long tasksUnassigned
) {
    /**
     * A project that passes to someone else.
     *
     * @param projectName the project
     * @param successorUsername who will own it
     */
    public record ProjectHandover(String projectName, String successorUsername) {}
}
