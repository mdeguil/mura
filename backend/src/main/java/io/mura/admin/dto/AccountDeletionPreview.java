package io.mura.admin.dto;

import java.util.List;

// What deleting an account will actually do, worked out before anything is
// done. Deletion is irreversible and reaches other people's work, so the
// administrator is shown the consequences by name rather than asked to
// trust a warning.
public record AccountDeletionPreview(
        String username,
        // Projects that outlive the account because somebody else is in
        // them, each with the person who will inherit it.
        List<ProjectHandover> projectsTransferred,
        // Projects nobody else belongs to. These go with the account.
        List<String> projectsDeleted,
        List<String> groupsDeleted,
        // Tasks that stay where they are and simply lose their assignee.
        long tasksUnassigned
) {
    public record ProjectHandover(String projectName, String successorUsername) {}
}
