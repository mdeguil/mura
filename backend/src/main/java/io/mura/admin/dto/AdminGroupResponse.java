package io.mura.admin.dto;

import io.mura.group.UserGroup;
import io.mura.member.dto.UserResponse;

import java.time.Instant;
import java.util.UUID;

// A group as an administrator sees it: who runs it and how many people are
// in it. Not who they are -- that is the gérant's list.
public record AdminGroupResponse(
        UUID id,
        String name,
        UserResponse manager,
        long memberCount,
        Instant createdAt
) {
    public static AdminGroupResponse of(UserGroup group, long memberCount) {
        return new AdminGroupResponse(
                group.getId(),
                group.getName(),
                UserResponse.from(group.getOwner()),
                memberCount,
                group.getCreatedAt()
        );
    }
}
