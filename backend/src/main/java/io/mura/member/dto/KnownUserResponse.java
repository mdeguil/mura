package io.mura.member.dto;

import java.util.List;
import java.util.UUID;

// Someone you have crossed paths with, and what you have in common. The
// directory is built from shared projects and exchanged invitations rather
// than from the list of every account: an address book, not a census.
public record KnownUserResponse(
        UUID id,
        String username,
        String email,
        String avatarUrl,
        List<SharedProject> sharedProjects,
        // True when the person was put in the carnet on purpose.
        boolean saved,
        boolean favourite,
        // Same reason as everywhere else a person is listed: someone
        // suspended is still in your carnet but cannot be reached.
        boolean suspended
) {
    public record SharedProject(UUID id, String name, String color) {}
}
