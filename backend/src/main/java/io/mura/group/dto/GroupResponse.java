package io.mura.group.dto;

import io.mura.member.dto.UserResponse;
import io.mura.group.UserGroup;
import io.mura.group.UserGroupMember;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A group as one of its members sees it.
 *
 * @param id the group's id
 * @param name its name
 * @param owner its gérant
 * @param owned whether the reader is the gérant, and so may rename it,
 *        delete it and manage its members
 * @param createdAt when it was created
 * @param members everyone in it, the gérant included
 */
public record GroupResponse(
        UUID id,
        String name,
        UserResponse owner,
        boolean owned,
        Instant createdAt,
        List<GroupMemberResponse> members
) {
    /**
     * Reads a group for one reader.
     *
     * @param group the group, with its owner loaded
     * @param viewerId the reader, to work out {@code owned}
     * @param members its memberships, with their users loaded
     * @return the group as that reader sees it
     */
    public static GroupResponse from(UserGroup group, UUID viewerId, List<UserGroupMember> members) {
        return new GroupResponse(
                group.getId(),
                group.getName(),
                UserResponse.from(group.getOwner()),
                group.getOwner().getId().equals(viewerId),
                group.getCreatedAt(),
                members.stream().map(GroupMemberResponse::from).toList()
        );
    }
}
