package io.mura.project;

import io.mura.member.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "project_invitations")
@Getter
@Setter
public class ProjectInvitation {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invited_user_id", nullable = false)
    private User invitedUser;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invited_by_id", nullable = false)
    private User invitedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    // Stays null while the invitation is pending.
    @Column(name = "responded_at")
    private Instant respondedAt;

    // Null until the invitee opens their notifications: it drives the
    // unread count on the bell, not whether the invitation is still live.
    @Column(name = "read_at")
    private Instant readAt;

    // Set when the invitee clears the notification. The invitation stays
    // pending and keeps showing in their projects list; only the bell
    // forgets about it.
    @Column(name = "dismissed_at")
    private Instant dismissedAt;

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }
}
