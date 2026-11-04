package io.mura.group;

import io.mura.member.User;
import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** One person's place in a group, and whether they are set aside in it. */
@Entity
@Table(name = "user_group_members")
@Getter
@Setter
@NoArgsConstructor
public class UserGroupMember {

    @EmbeddedId
    private UserGroupMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("groupId")
    @JoinColumn(name = "group_id")
    private UserGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    @Column(name = "on_hold_at")
    private Instant onHoldAt;

    /**
     * A new membership, not set aside.
     *
     * @param group the group
     * @param user the person joining it
     */
    public UserGroupMember(UserGroup group, User user) {
        this.group = group;
        this.user = user;
        this.id = new UserGroupMemberId(group.getId(), user.getId());
    }

    @PrePersist
    void onCreate() {
        joinedAt = Instant.now();
    }

    /**
     * Whether the gérant has set this person aside: still on the list, but
     * left out when the group is brought onto a project. Nothing to do with
     * a suspended account, which is an administrator's doing and shuts the
     * person out of Mura entirely.
     *
     * @return true while {@code onHoldAt} is set
     */
    public boolean isOnHold() {
        return onHoldAt != null;
    }
}
