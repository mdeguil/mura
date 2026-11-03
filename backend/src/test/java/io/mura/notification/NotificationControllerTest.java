package io.mura.notification;

import io.mura.common.exception.ApiException;
import io.mura.notification.dto.NotificationResponse;
import io.mura.support.ControllerTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest extends ControllerTestSupport {

    @Mock
    private NotificationService notificationService;

    private final UUID notificationId = UUID.randomUUID();
    private final NotificationResponse unread = new NotificationResponse(UUID.randomUUID(),
            NotificationType.ADDED_TO_PROJECT, UUID.randomUUID(), "Refonte", null, null, "alice", null, false,
            Instant.parse("2026-03-01T10:00:00Z"));

    @BeforeEach
    void setUp() {
        mount(new NotificationController(notificationService));
    }

    @Test
    void theBellListsTheCallersNotifications() throws Exception {
        when(notificationService.listForUser(ME)).thenReturn(List.of(unread));

        mvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].type").value("ADDED_TO_PROJECT"))
                .andExpect(jsonPath("$[0].read").value(false));
    }

    @Test
    void markingReadAndClearing() throws Exception {
        when(notificationService.markRead(ME, notificationId)).thenReturn(unread);

        mvc.perform(post("/api/notifications/{id}/read", notificationId)).andExpect(status().isOk());
        mvc.perform(delete("/api/notifications/{id}", notificationId)).andExpect(status().isNoContent());
        verify(notificationService).delete(ME, notificationId);
    }

    @Test
    void someoneElsesNotificationIsForbidden() throws Exception {
        doThrow(new ApiException(HttpStatus.FORBIDDEN, "Cette notification ne t'est pas adressée."))
                .when(notificationService).delete(ME, notificationId);

        mvc.perform(delete("/api/notifications/{id}", notificationId)).andExpect(status().isForbidden());
    }
}
