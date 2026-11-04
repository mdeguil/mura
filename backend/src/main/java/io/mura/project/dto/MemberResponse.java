package io.mura.project.dto;

import io.mura.member.User;
import io.mura.project.ProjectMember;
import io.mura.project.ProjectRole;

import java.util.UUID;

/**
 * A member of a project: the person flattened with the role they hold on
 * it, so the UI can render an avatar and a badge from a single object.
 *
 * @param id the person's account id
 * @param email their address, or null for a reader who is only invited
 * @param username their name
 * @param avatarUrl their picture, or null
 * @param role their role on this project
 * @param suspended whether their account is suspended: still on the team,
 *        but they cannot be reached
 */
public record MemberResponse(
        UUID id,
        String email,
        String username,
        String avatarUrl,
        ProjectRole role,
        boolean suspended
) {
    /**
     * Reads a membership for a member of the same team.
     *
     * @param member the membership, with its user loaded
     * @return the member, address included
     */
    public static MemberResponse from(ProjectMember member) {
        return build(member, true);
    }

    /**
     * Reads a membership for someone deciding whether to join. They may see
     * who is already on the team -- that is part of the decision -- but
     * their addresses are not this person's to read until they are on it
     * too.
     *
     * @param member the membership, with its user loaded
     * @return the member, without the address
     */
    public static MemberResponse withoutEmail(ProjectMember member) {
        return build(member, false);
    }

    private static MemberResponse build(ProjectMember member, boolean withEmail) {
        User user = member.getUser();
        return new MemberResponse(
                user.getId(),
                withEmail ? user.getEmail() : null,
                user.getUsername(),
                user.getAvatarUrl(),
                member.getRole(),
                user.isSuspended()
        );
    }
}
