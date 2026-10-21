package io.mura.group.dto;

import io.mura.member.dto.UserResponse;
import io.mura.group.UserGroup;
import io.mura.group.UserGroupMember;

import java.util.List;
import java.util.UUID;

public record GroupResponse(
        UUID id,
        String name,
        UserResponse owner,
        boolean owned,
        List<UserResponse> members
) {
    public static GroupResponse from(UserGroup group, UUID viewerId, List<UserGroupMember> members) {
        return new GroupResponse(
                group.getId(),
                group.getName(),
                UserResponse.from(group.getOwner()),
                group.getOwner().getId().equals(viewerId),
                members.stream().map(m -> UserResponse.from(m.getUser())).toList()
        );
    }
}
