package io.mura.notification;

import io.mura.common.exception.ApiException;
import io.mura.group.UserGroup;
import io.mura.mail.MailService;
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

/**
 * The bell. Every notification is written through here, and every one is
 * also mailed -- unless its recipient is suspended, since they cannot sign
 * in to act on it.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final MailService mailService;

    /**
     * What a reader's bell holds.
     *
     * @param userId the reader
     * @return their notifications, newest first
     */
    @Transactional(readOnly = true)
    public List<NotificationResponse> listForUser(UUID userId) {
        return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    /**
     * Puts a line about a project in the recipient's bell and mails it,
     * unless their account is suspended. The project's name is copied, so
     * the line still reads correctly once the project is gone. A blank
     * message is dropped.
     *
     * @param recipient who to tell
     * @param type what happened
     * @param project the project it happened in
     * @param actor who did it
     * @param message a note from the actor, or null
     */
    @Transactional
    public void notify(User recipient, NotificationType type, Project project, User actor, String message) {
        Notification notification = new Notification();
        notification.setProject(project);
        notification.setProjectName(project.getName());
        notification.setMessage(message == null || message.isBlank() ? null : message.trim());
        record(notification, recipient, type, actor.getUsername());
    }

    /**
     * The group counterpart of {@link #notify}. A group owner is told about
     * the people in their group, so the subject is the member whose account
     * or membership changed -- not the administrator who changed it, whose
     * identity is nobody else's business.
     *
     * @param recipient who to tell
     * @param type what happened
     * @param group the group it concerns, which the line links to
     * @param subject who the line is about
     */
    @Transactional
    public void notifyAboutGroup(User recipient, NotificationType type, UserGroup group, User subject) {
        Notification notification = new Notification();
        notification.setGroup(group);
        notification.setGroupName(group.getName());
        record(notification, recipient, type, subject.getUsername());
    }

    /**
     * A line about a group by name only, for a reader who has nothing left
     * to open: they were taken out of it, or it no longer exists. The name
     * is a snapshot, which is why the line still reads correctly.
     *
     * @param recipient who to tell
     * @param type what happened
     * @param groupName the group's name
     * @param subject who the line is about
     */
    @Transactional
    public void notifyAboutFormerGroup(
            User recipient, NotificationType type, String groupName, User subject
    ) {
        Notification notification = new Notification();
        notification.setGroupName(groupName);
        record(notification, recipient, type, subject.getUsername());
    }

    /**
     * A line about a person: neither a project nor a group, and the person
     * is the subject already. Used for carnet requests.
     *
     * @param recipient who to tell
     * @param type what happened
     * @param subject who the line is about
     */
    @Transactional
    public void notifyAboutPerson(User recipient, NotificationType type, User subject) {
        record(new Notification(), recipient, type, subject.getUsername());
    }

    // The one place a notification comes into being, so a type added later
    // cannot quietly arrive without its mail.
    private void record(Notification notification, User recipient, NotificationType type, String actorName) {
        notification.setUser(recipient);
        notification.setType(type);
        notification.setActorName(actorName);
        // Set here rather than in @PrePersist: callers read the row back
        // before the flush.
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);

        // Nothing to act on and no way in: a suspended account cannot sign
        // in, so the mail would only be a reminder of that.
        if (recipient.isSuspended()) {
            return;
        }

        NotificationWording.Lines lines = NotificationWording.of(notification);
        mailService.sendNotification(
                recipient.getEmail(),
                recipient.getUsername(),
                lines.subject(),
                lines.heading(),
                lines.sentence(),
                notification.getMessage(),
                lines.linkPath(),
                lines.linkLabel()
        );
    }

    /**
     * Marks a notification as read. Reading it again keeps the first date.
     *
     * @param userId the reader
     * @param notificationId the notification
     * @return the notification, now read
     * @throws ApiException 404 if it does not exist, 403 if it is someone
     *         else's
     */
    @Transactional
    public NotificationResponse markRead(UUID userId, UUID notificationId) {
        Notification notification = requireOwn(userId, notificationId);
        if (notification.getReadAt() == null) {
            notification.setReadAt(Instant.now());
        }
        return NotificationResponse.from(notification);
    }

    /**
     * Clears a notification from the bell. Nothing else holds these, so it
     * is deleted outright -- unlike an invitation, which is still waiting
     * for an answer.
     *
     * @param userId the reader
     * @param notificationId the notification
     * @throws ApiException 404 if it does not exist, 403 if it is someone
     *         else's
     */
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
