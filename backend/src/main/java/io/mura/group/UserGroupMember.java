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

    // Set aside by the gérant without being removed: still on the list, and
    // left out when the group is used to invite everybody. Nothing to do
    // with a suspended account, which is an administrator's doing and shuts
    // the person out of Mura entirely.
    @Column(name = "on_hold_at")
    private Instant onHoldAt;

    public UserGroupMember(UserGroup group, User user) {
        this.group = group;
        this.user = user;
        this.id = new UserGroupMemberId(group.getId(), user.getId());
    }

    @PrePersist
    void onCreate() {
        joinedAt = Instant.now();
    }

    public boolean isOnHold() {
        return onHoldAt != null;
    }
}
