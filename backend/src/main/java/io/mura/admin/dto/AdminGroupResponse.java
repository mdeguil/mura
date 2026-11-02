package io.mura.admin.dto;

import io.mura.group.UserGroup;
import io.mura.group.UserGroupMember;
import io.mura.group.dto.GroupMemberResponse;
import io.mura.member.dto.UserResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

// A group as an administrator sees it: who runs it and who is in it. The
// list is there to be read, not edited -- changing it is still the gérant's
// business, which is why nothing in /api/admin/groups writes to it.
public record AdminGroupResponse(
        UUID id,
        String name,
        UserResponse manager,
        long memberCount,
        Instant createdAt,
        List<GroupMemberResponse> members
) {
    public static AdminGroupResponse of(UserGroup group, List<UserGroupMember> members) {
        return new AdminGroupResponse(
                group.getId(),
                group.getName(),
                UserResponse.from(group.getOwner()),
                members.size(),
                group.getCreatedAt(),
                members.stream().map(GroupMemberResponse::from).toList()
        );
    }
}
