package io.mura.group.dto;

import io.mura.group.UserGroupMember;
import io.mura.member.User;

import java.time.Instant;
import java.util.UUID;

// A person in a group, plus the two facts that belong to the membership
// rather than to them: when they joined, and whether the gérant has set
// them aside.
//
// Suspension travels with the account and means the person cannot sign in
// at all; onHold concerns this group only. Two different things, kept as
// two different fields on purpose.
public record GroupMemberResponse(
        UUID id,
        String email,
        String username,
        String avatarUrl,
        boolean suspended,
        boolean onHold,
        Instant joinedAt
) {
    public static GroupMemberResponse from(UserGroupMember membership) {
        User user = membership.getUser();
        return new GroupMemberResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getAvatarUrl(),
                user.isSuspended(),
                membership.isOnHold(),
                membership.getJoinedAt()
        );
    }
}
