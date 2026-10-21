package io.mura.notification.dto;

import io.mura.notification.Notification;
import io.mura.notification.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        NotificationType type,
        UUID projectId,
        String projectName,
        String actorName,
        String message,
        boolean read,
        Instant createdAt
) {
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType(),
                // Someone removed from a project has no business linking back
                // into it, so the id is only carried when it still opens.
                notification.getType() == NotificationType.REMOVED_FROM_PROJECT || notification.getProject() == null
                        ? null
                        : notification.getProject().getId(),
                notification.getProjectName(),
                notification.getActorName(),
                notification.getMessage(),
                notification.getReadAt() != null,
                notification.getCreatedAt()
        );
    }
}
