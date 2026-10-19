package io.mura.project.dto;

import io.mura.member.User;
import io.mura.project.ProjectMember;
import io.mura.project.ProjectRole;

import java.util.UUID;

// Flattens the user with the role they hold on this project, so the UI can
// render an avatar and a badge from a single object.
public record MemberResponse(
        UUID id,
        String email,
        String username,
        String avatarUrl,
        ProjectRole role
) {
    public static MemberResponse from(ProjectMember member) {
        return build(member, true);
    }

    // Someone deciding whether to join may see who is already on the team —
    // that is part of the decision — but their addresses are not this
    // person's to read until they are on it too.
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
                member.getRole()
        );
    }
}
