package io.mura.admin.dto;

import io.mura.group.UserGroup;
import io.mura.group.UserGroupMember;
import io.mura.group.dto.GroupMemberResponse;
import io.mura.member.dto.UserResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A group as an administrator sees it: who runs it and who is in it. The
 * list is there to be read, not edited -- changing it is still the gérant's
 * business, which is why nothing in {@code /api/admin/groups} writes to it.
 *
 * @param id the group's id
 * @param name its name
 * @param manager its gérant
 * @param memberCount how many people are in it, the gérant included
 * @param createdAt when it was created
 * @param members everyone in it
 */
public record AdminGroupResponse(
        UUID id,
        String name,
        UserResponse manager,
        long memberCount,
        Instant createdAt,
        List<GroupMemberResponse> members
) {
    /**
     * Reads a group for the administration.
     *
     * @param group the group, with its owner loaded
     * @param members its memberships, with their users loaded
     * @return the group as an administrator sees it
     */
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
