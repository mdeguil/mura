package io.mura.member.dto;

import java.util.List;
import java.util.UUID;

/**
 * Someone you have crossed paths with, and what you have in common. The
 * directory is built from shared projects and exchanged invitations rather
 * than from the list of every account: an address book, not a census.
 *
 * @param id the person's account id
 * @param username their name
 * @param email their address, or null where it is not the reader's to see
 * @param avatarUrl their picture, or null
 * @param sharedProjects the projects both of you are on
 * @param saved whether they were put in the carnet on purpose
 * @param favourite whether the reader starred them
 * @param suspended whether their account is suspended: still in your
 *        carnet, but they cannot be reached
 * @param pending asked for, not yet answered; shown to whoever asked, so a
 *        request does not look like it went nowhere
 */
public record KnownUserResponse(
        UUID id,
        String username,
        String email,
        String avatarUrl,
        List<SharedProject> sharedProjects,
        boolean saved,
        boolean favourite,
        boolean suspended,
        boolean pending
) {
    /**
     * A project the reader and this person are both on.
     *
     * @param id the project's id
     * @param name its name
     * @param color its colour, as {@code #rrggbb}
     */
    public record SharedProject(UUID id, String name, String color) {}
}
