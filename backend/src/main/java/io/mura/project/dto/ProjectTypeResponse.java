package io.mura.project.dto;

import io.mura.project.ProjectType;

import java.util.UUID;

/**
 * A project type. The emoji travels with the label because they are one
 * thing on screen, and because the client has no business knowing which
 * emoji goes with which name -- that is an administrator's decision.
 *
 * @param id the type's id
 * @param label its name
 * @param emoji its emoji
 * @param position where it comes in the list
 * @param fallback whether it is the type that cannot be deleted
 * @param projectCount how many projects would move if it went; only filled
 *        in for an administrator, who is the only one who can act on it
 */
public record ProjectTypeResponse(
        UUID id,
        String label,
        String emoji,
        int position,
        boolean fallback,
        Long projectCount
) {
    /**
     * Reads a type without its project count.
     *
     * @param type the type
     * @return the type, {@code projectCount} null
     */
    public static ProjectTypeResponse from(ProjectType type) {
        return of(type, null);
    }

    /**
     * Reads a type with its project count, for the administration.
     *
     * @param type the type
     * @param projectCount how many projects it holds
     * @return the type
     */
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
