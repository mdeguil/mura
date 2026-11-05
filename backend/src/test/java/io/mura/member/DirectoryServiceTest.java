package io.mura.member;

import io.mura.common.exception.ApiException;
import io.mura.member.dto.AddContactRequest;
import io.mura.member.dto.KnownUserResponse;
import io.mura.notification.NotificationService;
import io.mura.notification.NotificationType;
import io.mura.project.Project;
import io.mura.project.ProjectRole;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DirectoryServiceTest {

    @Mock
    private DirectoryRepository directoryRepository;
    @Mock
    private ContactRepository contactRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;
    @InjectMocks
    private DirectoryService service;

    private User alice;
    private User bob;
    private User carol;

    @BeforeEach
    void setUp() {
        alice = Fixtures.user("alice");
        bob = Fixtures.user("bob");
        carol = Fixtures.user("Carol");
        when(directoryRepository.findSharedMemberships(any())).thenReturn(List.of());
        when(directoryRepository.findInvitedByMe(any())).thenReturn(List.of());
        when(directoryRepository.findWhoInvitedMe(any())).thenReturn(List.of());
        when(contactRepository.findAllForOwner(any())).thenReturn(List.of());
        when(contactRepository.findByOwnerIdAndPersonId(any(), any())).thenReturn(Optional.empty());
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(userRepository.findById(bob.getId())).thenReturn(Optional.of(bob));
    }

    private Contact contact(User owner, User person, ContactStatus status) {
        Contact contact = new Contact(owner, person);
        contact.setStatus(status);
        return contact;
    }

    @Test
    void someoneOnASharedProjectIsKnownWithThatProject() {
        Project project = Fixtures.project("Refonte", alice);
        when(directoryRepository.findSharedMemberships(alice.getId()))
                .thenReturn(List.of(Fixtures.member(project, bob, ProjectRole.MEMBER)));

        List<KnownUserResponse> known = service.listKnownTo(alice.getId());

        assertThat(known).singleElement().satisfies(person -> {
            assertThat(person.username()).isEqualTo("bob");
            assertThat(person.sharedProjects()).extracting(KnownUserResponse.SharedProject::name)
                    .containsExactly("Refonte");
            assertThat(person.saved()).isFalse();
        });
    }

    @Test
    void invitationCounterpartsAreKnownInBothDirections() {
        when(directoryRepository.findInvitedByMe(alice.getId())).thenReturn(List.of(bob));
        when(directoryRepository.findWhoInvitedMe(alice.getId())).thenReturn(List.of(carol));

        assertThat(service.listKnownTo(alice.getId())).extracting(KnownUserResponse::username)
                .containsExactlyInAnyOrder("bob", "Carol");
    }

    @Test
    void someoneTakenOutStaysOutEvenWithASharedProject() {
        Project project = Fixtures.project("Refonte", alice);
        when(directoryRepository.findSharedMemberships(alice.getId()))
                .thenReturn(List.of(Fixtures.member(project, bob, ProjectRole.MEMBER)));
        Contact hidden = contact(alice, bob, ContactStatus.ACCEPTED);
        hidden.setHidden(true);
        when(contactRepository.findAllForOwner(alice.getId())).thenReturn(List.of(hidden));

        assertThat(service.listKnownTo(alice.getId())).isEmpty();
    }

    @Test
    void aPendingRequestShowsAsPendingAndADeclinedOneNotAtAll() {
        when(contactRepository.findAllForOwner(alice.getId())).thenReturn(List.of(
                contact(alice, bob, ContactStatus.PENDING), contact(alice, carol, ContactStatus.DECLINED)));

        assertThat(service.listKnownTo(alice.getId())).singleElement().satisfies(person -> {
            assertThat(person.username()).isEqualTo("bob");
            assertThat(person.pending()).isTrue();
            assertThat(person.saved()).isFalse();
        });
    }

    @Test
    void favouritesComeFirstThenAlphabeticalIgnoringCase() {
        User dave = Fixtures.user("dave");
        Contact favourite = contact(alice, dave, ContactStatus.ACCEPTED);
        favourite.setFavourite(true);
        when(contactRepository.findAllForOwner(alice.getId())).thenReturn(List.of(
                contact(alice, bob, ContactStatus.ACCEPTED), contact(alice, carol, ContactStatus.ACCEPTED), favourite));

        assertThat(service.listKnownTo(alice.getId())).extracting(KnownUserResponse::username)
                .containsExactly("dave", "bob", "Carol");
    }

    @Test
    void addingSomeoneSendsThemARequest() {
        when(userRepository.findByEmailIgnoreCase("bob@mura.test")).thenReturn(Optional.of(bob));

        KnownUserResponse response = service.addContact(alice.getId(), new AddContactRequest(" bob@mura.test "));

        ArgumentCaptor<Contact> saved = ArgumentCaptor.forClass(Contact.class);
        verify(contactRepository).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo(ContactStatus.PENDING);
        assertThat(response.pending()).isTrue();
        verify(notificationService).notifyAboutPerson(bob, NotificationType.CONTACT_REQUESTED, alice);
    }

    @Test
    void addingYourselfOrAnUnknownAddressIsRefused() {
        when(userRepository.findByEmailIgnoreCase("alice@mura.test")).thenReturn(Optional.of(alice));
        when(userRepository.findByEmailIgnoreCase("nobody@mura.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.addContact(alice.getId(), new AddContactRequest("alice@mura.test")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
        assertThatThrownBy(() -> service.addContact(alice.getId(), new AddContactRequest("nobody@mura.test")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void askingTwiceOrAskingSomeoneAlreadyInIsRefused() {
        when(userRepository.findByEmailIgnoreCase("bob@mura.test")).thenReturn(Optional.of(bob));

        when(contactRepository.findByOwnerIdAndPersonId(alice.getId(), bob.getId()))
                .thenReturn(Optional.of(contact(alice, bob, ContactStatus.PENDING)));
        assertThatThrownBy(() -> service.addContact(alice.getId(), new AddContactRequest("bob@mura.test")))
                .hasMessageContaining("pas encore répondu");

        when(contactRepository.findByOwnerIdAndPersonId(alice.getId(), bob.getId()))
                .thenReturn(Optional.of(contact(alice, bob, ContactStatus.ACCEPTED)));
        assertThatThrownBy(() -> service.addContact(alice.getId(), new AddContactRequest("bob@mura.test")))
                .hasMessageContaining("déjà dans ton carnet");
        verifyNoInteractions(notificationService);
    }

    @Test
    void twoCrossingRequestsBecomeAnAcceptance() {
        when(userRepository.findByEmailIgnoreCase("bob@mura.test")).thenReturn(Optional.of(bob));
        Contact bobsRequest = contact(bob, alice, ContactStatus.PENDING);
        when(contactRepository.findByOwnerIdAndPersonId(bob.getId(), alice.getId())).thenReturn(Optional.of(bobsRequest));

        KnownUserResponse response = service.addContact(alice.getId(), new AddContactRequest("bob@mura.test"));

        assertThat(bobsRequest.getStatus()).isEqualTo(ContactStatus.ACCEPTED);
        assertThat(response.saved()).isTrue();
        verify(notificationService).notifyAboutPerson(bob, NotificationType.CONTACT_ACCEPTED, alice);
        verify(notificationService, never()).notifyAboutPerson(any(), org.mockito.ArgumentMatchers.eq(NotificationType.CONTACT_REQUESTED), any());
    }

    @Test
    void acceptingIsMutual() {
        Contact bobsRequest = contact(bob, alice, ContactStatus.PENDING);
        when(contactRepository.findByOwnerIdAndPersonId(bob.getId(), alice.getId())).thenReturn(Optional.of(bobsRequest));

        service.accept(alice.getId(), bob.getId());

        ArgumentCaptor<Contact> saved = ArgumentCaptor.forClass(Contact.class);
        verify(contactRepository, atLeastOnce()).save(saved.capture());
        assertThat(saved.getAllValues()).extracting(c -> c.getOwner().getUsername(), Contact::getStatus)
                .contains(org.assertj.core.groups.Tuple.tuple("bob", ContactStatus.ACCEPTED),
                        org.assertj.core.groups.Tuple.tuple("alice", ContactStatus.ACCEPTED));
    }

    @Test
    void decliningKeepsTheRowAndTellsNobody() {
        Contact bobsRequest = contact(bob, alice, ContactStatus.PENDING);
        when(contactRepository.findByOwnerIdAndPersonId(bob.getId(), alice.getId())).thenReturn(Optional.of(bobsRequest));

        service.decline(alice.getId(), bob.getId());

        assertThat(bobsRequest.getStatus()).isEqualTo(ContactStatus.DECLINED);
        verify(contactRepository).save(bobsRequest);
        verifyNoInteractions(notificationService);
    }

    @Test
    void answeringARequestThatIsNoLongerPendingIsNotFound() {
        assertThatThrownBy(() -> service.accept(alice.getId(), bob.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void removingHidesRatherThanDeletes() {
        service.removeContact(alice.getId(), bob.getId());

        ArgumentCaptor<Contact> saved = ArgumentCaptor.forClass(Contact.class);
        verify(contactRepository).save(saved.capture());
        assertThat(saved.getValue().isHidden()).isTrue();
        verify(contactRepository, never()).delete(any());
    }

    @Test
    void favouritingSomeoneTakenOutIsRefused() {
        Contact hidden = contact(alice, bob, ContactStatus.ACCEPTED);
        hidden.setHidden(true);
        when(contactRepository.findByOwnerIdAndPersonId(alice.getId(), bob.getId())).thenReturn(Optional.of(hidden));

        assertThatThrownBy(() -> service.setFavourite(alice.getId(), bob.getId(), true))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void favouritingCreatesTheRowWhenThereIsNone() {
        KnownUserResponse response = service.setFavourite(alice.getId(), bob.getId(), true);

        assertThat(response.favourite()).isTrue();
        verify(contactRepository).save(any(Contact.class));
    }

    @Test
    void requestsListWhoIsWaitingOnMe() {
        when(contactRepository.findPendingForPerson(alice.getId()))
                .thenReturn(List.of(contact(bob, alice, ContactStatus.PENDING)));

        assertThat(service.listRequests(alice.getId())).singleElement().satisfies(request -> {
            assertThat(request.username()).isEqualTo("bob");
            assertThat(request.pending()).isTrue();
        });
    }
}
