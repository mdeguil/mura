package io.mura.project;

import io.mura.member.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.FetchType;
import jakarta.persistence.MapsId;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "project_members")
@Getter
@Setter
@NoArgsConstructor
public class ProjectMember {

    @EmbeddedId
    private ProjectMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("projectId")
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String role;

    @Column(name = "joined_at", nullable = false, updatable = false)
    private Instant joinedAt;

    public ProjectMember(Project project, User user, String role) {
        this.project = project;
        this.user = user;
        this.id = new ProjectMemberId(project.getId(), user.getId());
        this.role = role;
    }

    @PrePersist
    void onCreate() {
        joinedAt = Instant.now();
    }
}
