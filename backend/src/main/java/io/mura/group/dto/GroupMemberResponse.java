package io.mura.group.dto;

import io.mura.group.UserGroupMember;
import io.mura.member.User;

import java.time.Instant;
import java.util.UUID;

/**
 * A person in a group, plus the two facts that belong to the membership
 * rather than to them: when they joined, and whether the gérant has set
 * them aside.
 *
 * <p>Suspension travels with the account and means the person cannot sign
 * in at all; onHold concerns this group only. Two different things, kept as
 * two different fields on purpose.
 *
 * @param id the person's account id
 * @param email their address
 * @param username their name
 * @param avatarUrl their picture, or null
 * @param suspended whether their account is suspended
 * @param onHold whether the gérant set them aside in this group
 * @param joinedAt when they were added to the group
 */
public record GroupMemberResponse(
        UUID id,
        String email,
        String username,
        String avatarUrl,
        boolean suspended,
        boolean onHold,
        Instant joinedAt
) {
    /**
     * Reads a membership with its account.
     *
     * @param membership the membership, with its user loaded
     * @return the member as the group page shows them
     */
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
