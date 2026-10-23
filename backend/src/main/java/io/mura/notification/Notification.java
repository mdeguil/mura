package io.mura.notification;

import io.mura.group.UserGroup;
import io.mura.member.User;
import io.mura.project.Project;
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
@Table(name = "notifications")
@Getter
@Setter
public class Notification {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    // Kept as text rather than read through the association: someone removed
    // from a project can no longer load it, and the line still has to name it.
    // Null when the notification is about a group instead.
    @Column(name = "project_name")
    private String projectName;

    // The other possible subject. Exactly one of the two is set, which the
    // database enforces.
    @Column(name = "group_name")
    private String groupName;

    // The way back to it, carried only while the reader still has a group to
    // open: null once they are out of it, or once it is gone.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private UserGroup group;

    // Who the line is about: the person who acted for a project, or the
    // person whose account changed for a group.
    @Column(name = "actor_name", nullable = false)
    private String actorName;

    // The word of explanation left by whoever acted. Optional.
    @Column
    private String message;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
