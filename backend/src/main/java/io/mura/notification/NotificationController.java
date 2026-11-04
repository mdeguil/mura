package io.mura.notification;

import io.mura.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * The bell, under {@code /api/notifications}. Every route acts on the
 * signed-in account's own notifications.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * {@code GET /api/notifications}: what the reader's bell holds.
     *
     * @param userId the signed-in account
     * @return 200 with the notifications, newest first
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(notificationService.listForUser(userId));
    }

    /**
     * {@code POST /api/notifications/{notificationId}/read}: marks one as
     * read.
     *
     * @param userId the signed-in account
     * @param notificationId the notification
     * @return 200 with the notification, now read
     * @see NotificationService#markRead(UUID, UUID)
     */
    @PostMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markRead(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID notificationId
    ) {
        return ResponseEntity.ok(notificationService.markRead(userId, notificationId));
    }

    /**
     * {@code DELETE /api/notifications/{notificationId}}: clears one from
     * the bell for good.
     *
     * @param userId the signed-in account
     * @param notificationId the notification
     * @return 204
     * @see NotificationService#delete(UUID, UUID)
     */
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID notificationId
    ) {
        notificationService.delete(userId, notificationId);
        return ResponseEntity.noContent().build();
    }
}
