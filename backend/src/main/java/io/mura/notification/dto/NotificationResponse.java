package io.mura.notification.dto;

import io.mura.notification.Notification;
import io.mura.notification.NotificationType;

import java.time.Instant;
import java.util.UUID;

/**
 * A line in the bell. Names are copied at the time it was written, so it
 * still reads correctly once the project or group is renamed or gone; the
 * ids are there only when there is still something to open.
 *
 * @param id the notification's id
 * @param type what it is about
 * @param projectId the project to open, or null: someone removed from a
 *        project has no business linking back into it, and a deleted
 *        project has nothing to open
 * @param projectName the project's name when it was written, or null
 * @param groupId the group to open, or null when the reader has nothing
 *        left to open there
 * @param groupName the group's name when it was written, or null
 * @param actorName who caused it
 * @param message the note that came with it, or null
 * @param read whether the reader has read it
 * @param createdAt when it was written
 */
public record NotificationResponse(
        UUID id,
        NotificationType type,
        UUID projectId,
        String projectName,
        UUID groupId,
        String groupName,
        String actorName,
        String message,
        boolean read,
        Instant createdAt
) {
    /**
     * Reads a stored notification as the bell shows it.
     *
     * @param notification the stored notification
     * @return the line, with the links that still open
     */
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                notification.getType() == NotificationType.REMOVED_FROM_PROJECT || notification.getProject() == null
                        ? null
                        : notification.getProject().getId(),
                notification.getProjectName(),
                notification.getGroup() == null ? null : notification.getGroup().getId(),
                notification.getGroupName(),
                notification.getActorName(),
                notification.getMessage(),
                notification.getReadAt() != null,
                notification.getCreatedAt()
        );
    }
}
