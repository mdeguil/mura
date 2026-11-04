package io.mura.project;

import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

/** The key of a {@link ProjectMember}: which project, and who is on it. */
@Embeddable
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode
public class ProjectMemberId implements Serializable {

    /** The project. */
    private UUID projectId;

    /** The member. */
    private UUID userId;

    /**
     * Builds the key of one membership.
     *
     * @param projectId the project
     * @param userId the member
     */
    public ProjectMemberId(UUID projectId, UUID userId) {
        this.projectId = projectId;
        this.userId = userId;
    }
}
