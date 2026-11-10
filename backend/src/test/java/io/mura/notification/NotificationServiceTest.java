package io.mura.notification;

import io.mura.common.exception.ApiException;
import io.mura.group.UserGroup;
import io.mura.mail.MailService;
import io.mura.member.User;
import io.mura.project.Project;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.Locale;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;
    @Mock
    private MailService mailService;
    @InjectMocks
    private NotificationService service;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = Fixtures.user("alice");
        bob = Fixtures.user("bob");
    }

    private Notification saved() {
        ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);
        verify(notificationRepository).save(captor.capture());
        return captor.getValue();
    }

    @Test
    void notifyRecordsTheProjectAndMailsTheRecipient() {
        Project project = Fixtures.project("Refonte", alice);

        service.notify(bob, NotificationType.ADDED_TO_PROJECT, project, alice, "  Bienvenue  ");

        Notification notification = saved();
        assertThat(notification.getUser()).isEqualTo(bob);
        assertThat(notification.getProject()).isEqualTo(project);
        assertThat(notification.getProjectName()).isEqualTo("Refonte");
        assertThat(notification.getActorName()).isEqualTo("alice");
        assertThat(notification.getMessage()).isEqualTo("Bienvenue");
        assertThat(notification.getCreatedAt()).isNotNull();
        verify(mailService).sendNotification(eq("bob@mura.test"), eq("bob"), eq("alice t'a ajouté à Refonte"),
                anyString(), anyString(), eq("Bienvenue"), eq("/project/" + project.getId()), eq("Ouvrir le projet"), any());
    }

    @Test
    void aBlankMessageIsStoredAsNoMessage() {
        service.notify(bob, NotificationType.REMOVED_FROM_PROJECT, Fixtures.project("Refonte", alice), alice, "   ");

        assertThat(saved().getMessage()).isNull();
        verify(mailService).sendNotification(anyString(), anyString(), anyString(), anyString(), anyString(),
                isNull(), anyString(), anyString(), any());
    }

    @Test
    void aSuspendedAccountIsNotifiedButNotMailed() {
        Fixtures.suspended(bob);

        service.notify(bob, NotificationType.REMOVED_FROM_PROJECT, Fixtures.project("Refonte", alice), alice, null);

        verify(notificationRepository).save(any(Notification.class));
        verifyNoInteractions(mailService);
    }

    @Test
    void aboutAGroupCarriesTheGroupAndNoProject() {
        UserGroup group = Fixtures.group("Design", alice);

        service.notifyAboutGroup(bob, NotificationType.ADDED_TO_GROUP, group, alice);

        Notification notification = saved();
        assertThat(notification.getGroup()).isEqualTo(group);
        assertThat(notification.getGroupName()).isEqualTo("Design");
        assertThat(notification.getProject()).isNull();
        assertThat(notification.getProjectName()).isNull();
    }

    @Test
    void aboutAFormerGroupKeepsOnlyItsName() {
        service.notifyAboutFormerGroup(bob, NotificationType.GROUP_DELETED, "Design", alice);

        Notification notification = saved();
        assertThat(notification.getGroup()).isNull();
        assertThat(notification.getGroupName()).isEqualTo("Design");
        verify(mailService).sendNotification(anyString(), anyString(), anyString(), anyString(), anyString(),
                isNull(), eq("/carnet"), anyString(), any());
    }

    @Test
    void aboutAPersonCarriesNeitherProjectNorGroup() {
        service.notifyAboutPerson(bob, NotificationType.CONTACT_REQUESTED, alice);

        Notification notification = saved();
        assertThat(notification.getProjectName()).isNull();
        assertThat(notification.getGroupName()).isNull();
        assertThat(notification.getActorName()).isEqualTo("alice");
    }

    private Notification notificationFor(User owner) {
        Notification notification = new Notification();
        notification.setId(UUID.randomUUID());
        notification.setUser(owner);
        notification.setType(NotificationType.CONTACT_ACCEPTED);
        notification.setActorName("alice");
        notification.setCreatedAt(Instant.parse("2026-03-01T10:00:00Z"));
        return notification;
    }

    private Notification stored(User owner) {
        Notification notification = notificationFor(owner);
        when(notificationRepository.findById(notification.getId())).thenReturn(Optional.of(notification));
        return notification;
    }

    @Test
    void markReadStampsOnceAndThenLeavesTheDateAlone() {
        Notification notification = stored(bob);

        assertThat(service.markRead(bob.getId(), notification.getId()).read()).isTrue();
        Instant first = notification.getReadAt();
        service.markRead(bob.getId(), notification.getId());

        assertThat(notification.getReadAt()).isEqualTo(first);
    }

    @Test
    void onlyItsRecipientMayReadOrClearANotification() {
        Notification notification = stored(bob);

        assertThatThrownBy(() -> service.markRead(alice.getId(), notification.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.delete(alice.getId(), notification.getId()))
                .isInstanceOf(ApiException.class);
        verify(notificationRepository, never()).delete(any());
    }

    @Test
    void clearingDeletesIt() {
        Notification notification = stored(bob);

        service.delete(bob.getId(), notification.getId());

        verify(notificationRepository).delete(notification);
    }

    @Test
    void anUnknownNotificationIsNotFound() {
        UUID unknown = UUID.randomUUID();
        when(notificationRepository.findById(unknown)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.markRead(bob.getId(), unknown))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void listForUserMapsNewestFirstAsTheRepositoryReturns() {
        Notification older = notificationFor(bob);
        when(notificationRepository.findAllByUserIdOrderByCreatedAtDesc(bob.getId())).thenReturn(List.of(older));

        assertThat(service.listForUser(bob.getId())).singleElement()
                .satisfies(n -> assertThat(n.read()).isFalse());
    }
}
