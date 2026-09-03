package io.mura.project;

import jakarta.persistence.Embeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.util.UUID;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode
public class ProjectMemberId implements Serializable {

    private UUID projectId;
    private UUID userId;

    public ProjectMemberId(UUID projectId, UUID userId) {
        this.projectId = projectId;
        this.userId = userId;
    }
}
