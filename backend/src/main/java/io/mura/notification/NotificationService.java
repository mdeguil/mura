package io.mura.notification;

import io.mura.common.exception.ApiException;
import io.mura.member.User;
import io.mura.notification.dto.NotificationResponse;
import io.mura.project.Project;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> listForUser(UUID userId) {
        return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional
    public void notify(User recipient, NotificationType type, Project project, User actor, String message) {
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setType(type);
        notification.setProject(project);
        notification.setProjectName(project.getName());
        notification.setActorName(actor.getUsername());
        notification.setMessage(message == null || message.isBlank() ? null : message.trim());
        // Set here rather than in @PrePersist: callers read the row back
        // before the flush.
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);
    }

    @Transactional
    public NotificationResponse markRead(UUID userId, UUID notificationId) {
        Notification notification = requireOwn(userId, notificationId);
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }
        return NotificationResponse.from(notification);
    }

    // Nothing else holds these, so clearing one deletes it outright —
    // unlike an invitation, which is still waiting for an answer.
    @Transactional
    public void delete(UUID userId, UUID notificationId) {
        notificationRepository.delete(requireOwn(userId, notificationId));
    }

    private Notification requireOwn(UUID userId, UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification introuvable."));

        if (!notification.getUser().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cette notification ne t'est pas adressée.");
        }

        return notification;
    }
}
