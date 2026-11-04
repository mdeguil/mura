package io.mura.group;

import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

/** The key of a {@link UserGroupMember}: which group, and who is in it. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode
public class UserGroupMemberId implements Serializable {

    /** The group. */
    private UUID groupId;

    /** The member. */
    private UUID userId;

    /**
     * Builds the key of one membership.
     *
     * @param groupId the group
     * @param userId the member
     */
    public UserGroupMemberId(UUID groupId, UUID userId) {
        this.groupId = groupId;
        this.userId = userId;
    }
}
