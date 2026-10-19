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
        User user = member.getUser();
        return new MemberResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getAvatarUrl(),
                member.getRole()
        );
    }
}
