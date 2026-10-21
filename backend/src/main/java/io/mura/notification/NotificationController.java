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

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(notificationService.listForUser(userId));
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markRead(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID notificationId
    ) {
        return ResponseEntity.ok(notificationService.markRead(userId, notificationId));
    }

    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID notificationId
    ) {
        notificationService.delete(userId, notificationId);
        return ResponseEntity.noContent().build();
    }
}
