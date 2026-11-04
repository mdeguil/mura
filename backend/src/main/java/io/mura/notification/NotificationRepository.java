package io.mura.notification;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/** The lines in each account's bell. */
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    /**
     * Everything in one account's bell.
     *
     * @param userId the recipient
     * @return their notifications, newest first
     */
    List<Notification> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
}
