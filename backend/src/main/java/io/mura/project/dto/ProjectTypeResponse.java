package io.mura.project.dto;

import io.mura.project.ProjectType;

import java.util.UUID;

// The emoji travels with the label because they are one thing on screen,
// and because the client has no business knowing which emoji goes with
// which name -- that is now an administrator's decision.
public record ProjectTypeResponse(
        UUID id,
        String label,
        String emoji,
        int position,
        // The one the picker cannot offer to delete.
        boolean fallback,
        // How many projects would move if it went. Only filled in for an
        // administrator, who is the only one who can act on it.
        Long projectCount
) {
    public static ProjectTypeResponse from(ProjectType type) {
        return of(type, null);
    }

    public static ProjectTypeResponse of(ProjectType type, Long projectCount) {
        return new ProjectTypeResponse(
                type.getId(),
                type.getLabel(),
                type.getEmoji(),
                type.getPosition(),
                type.isFallback(),
                projectCount
        );
    }
}
