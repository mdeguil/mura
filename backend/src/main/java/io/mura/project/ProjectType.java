package io.mura.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/**
 * A category a project is filed under, with its emoji. Was an enum until an
 * administrator needed to add one without a release. One type is the
 * fallback: it cannot be edited or deleted, and takes the projects of any
 * type that is.
 */
@Entity
@Table(name = "project_types")
@Getter
@Setter
public class ProjectType {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false)
    private String label;

    @Column(nullable = false)
    private String emoji;

    @Column(nullable = false)
    private int position;

    @Column(nullable = false)
    private boolean fallback;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
