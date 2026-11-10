package io.mura.project;

import io.mura.common.exception.ApiException;
import io.mura.mail.MailService;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.project.dto.CreateInvitationRequest;
import io.mura.project.dto.InvitationResponse;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InvitationServiceTest {

    private static final long LIFETIME_DAYS = 14;

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private ProjectInvitationRepository invitationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private MailService mailService;

    private InvitationService service;
    private User alice;
    private User bob;
    private Project project;

    @BeforeEach
    void setUp() {
        service = new InvitationService(new ProjectAccessGuard(projectRepository, projectMemberRepository),
                projectMemberRepository, invitationRepository,
                userRepository, mailService, LIFETIME_DAYS);
        alice = Fixtures.user("alice");
        bob = Fixtures.user("bob");
        project = Fixtures.project("Refonte", alice);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(projectRepository.existsById(project.getId())).thenReturn(true);
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), alice.getId()))
                .thenReturn(Optional.of(Fixtures.member(project, alice, ProjectRole.OWNER)));
        when(userRepository.findByEmailIgnoreCase("bob@mura.test")).thenReturn(Optional.of(bob));
        when(invitationRepository.findAllByProjectIdAndInvitedUserIdAndStatus(any(), any(), any())).thenReturn(List.of());
    }

    private ProjectInvitation invitation(InvitationStatus status, Instant createdAt) {
        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setId(UUID.randomUUID());
        invitation.setProject(project);
        invitation.setInvitedUser(bob);
        invitation.setInvitedBy(alice);
        invitation.setStatus(status);
        invitation.setCreatedAt(createdAt);
        when(invitationRepository.findById(invitation.getId())).thenReturn(Optional.of(invitation));
        return invitation;
    }

    private ProjectInvitation pending() {
        return invitation(InvitationStatus.PENDING, Instant.now().minus(Duration.ofDays(1)));
    }

    @Test
    void inviteCreatesAPendingInvitationAndMailsIt() {
        InvitationResponse response = service.invite(alice.getId(), project.getId(), new CreateInvitationRequest(" bob@mura.test "));

        assertThat(response.status()).isEqualTo(InvitationStatus.PENDING);
        assertThat(response.expiresAt()).isEqualTo(response.createdAt().plus(Duration.ofDays(LIFETIME_DAYS)));
        verify(invitationRepository).save(any(ProjectInvitation.class));
        verify(mailService).sendProjectInvitation("bob@mura.test", "bob", "alice", "Refonte", Locale.FRENCH);
    }

    @Test
    void aProjectAdminInvitesInTheirOwnName() {
        User carol = Fixtures.user("carol");
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), carol.getId()))
                .thenReturn(Optional.of(Fixtures.member(project, carol, ProjectRole.ADMIN)));

        service.invite(carol.getId(), project.getId(), new CreateInvitationRequest("bob@mura.test"));

        ArgumentCaptor<ProjectInvitation> saved = ArgumentCaptor.forClass(ProjectInvitation.class);
        verify(invitationRepository).save(saved.capture());
        assertThat(saved.getValue().getInvitedBy()).isSameAs(carol);
        verify(mailService).sendProjectInvitation("bob@mura.test", "bob", "carol", "Refonte", Locale.FRENCH);
    }

    @Test
    void onlyAManagerMayInvite() {
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), bob.getId()))
                .thenReturn(Optional.of(Fixtures.member(project, bob, ProjectRole.MEMBER)));
        User outsider = Fixtures.user("carol");
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), outsider.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.invite(bob.getId(), project.getId(), new CreateInvitationRequest("bob@mura.test")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.invite(outsider.getId(), project.getId(), new CreateInvitationRequest("bob@mura.test")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        verifyNoInteractions(mailService);
    }

    @Test
    void anUnknownAddressOrSomeoneAlreadyOnTheTeamIsRefused() {
        when(userRepository.findByEmailIgnoreCase("nobody@mura.test")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.invite(alice.getId(), project.getId(), new CreateInvitationRequest("nobody@mura.test")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), bob.getId())).thenReturn(true);
        assertThatThrownBy(() -> service.invite(alice.getId(), project.getId(), new CreateInvitationRequest("bob@mura.test")))
                .hasMessageContaining("fait déjà partie");
        verify(invitationRepository, never()).save(any());
    }

    @Test
    void aSecondPendingInvitationIsRefused() {
        when(invitationRepository.existsByProjectIdAndInvitedUserIdAndStatus(project.getId(), bob.getId(), InvitationStatus.PENDING))
                .thenReturn(true);

        assertThatThrownBy(() -> service.invite(alice.getId(), project.getId(), new CreateInvitationRequest("bob@mura.test")))
                .hasMessageContaining("invitation en attente");
    }

    @Test
    void aLapsedPendingInvitationIsExpiredBeforeBeingCheckedSoANewOneCanGo() {
        ProjectInvitation lapsed = invitation(InvitationStatus.PENDING, Instant.now().minus(Duration.ofDays(20)));
        when(invitationRepository.findAllByProjectIdAndInvitedUserIdAndStatus(project.getId(), bob.getId(), InvitationStatus.PENDING))
                .thenReturn(List.of(lapsed));

        service.invite(alice.getId(), project.getId(), new CreateInvitationRequest("bob@mura.test"));

        assertThat(lapsed.getStatus()).isEqualTo(InvitationStatus.EXPIRED);
        verify(invitationRepository).flush();
    }

    @Test
    void reinvitingReplacesARefusedOrLapsedInvitation() {
        ProjectInvitation declined = invitation(InvitationStatus.DECLINED, Instant.now().minus(Duration.ofDays(3)));
        when(invitationRepository.findAllByProjectIdAndInvitedUserIdAndStatus(project.getId(), bob.getId(), InvitationStatus.DECLINED))
                .thenReturn(List.of(declined));

        service.invite(alice.getId(), project.getId(), new CreateInvitationRequest("bob@mura.test"));

        verify(invitationRepository).deleteAll(List.of(declined));
    }

    @Test
    void inviteAllWithNothingToInviteDoesNothing() {
        assertThat(service.inviteAll(project, alice, null)).isEmpty();
        assertThat(service.inviteAll(project, alice, List.of())).isEmpty();
        verifyNoInteractions(invitationRepository, mailService);
    }

    @Test
    void inviteAllChecksEveryAddressBeforeMailingAnyone() {
        when(userRepository.findByEmailIgnoreCase("nobody@mura.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.inviteAll(project, alice, List.of("bob@mura.test", "nobody@mura.test")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        verifyNoInteractions(mailService);
        verify(invitationRepository, never()).save(any());
    }

    @Test
    void inviteAllRefusesTheOwnerInvitingThemself() {
        assertThatThrownBy(() -> service.inviteAll(project, alice, List.of("ALICE@mura.test")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void inviteAllInvitesEachDistinctAddressOnceAndMailsThem() {
        User carol = Fixtures.user("carol");
        when(userRepository.findByEmailIgnoreCase("carol@mura.test")).thenReturn(Optional.of(carol));

        List<InvitationResponse> sent = service.inviteAll(project, alice,
                List.of("bob@mura.test", " BOB@mura.test ", "carol@mura.test", "  "));

        assertThat(sent).hasSize(2);
        verify(invitationRepository, times(2)).save(any(ProjectInvitation.class));
        verify(mailService).sendProjectInvitation("bob@mura.test", "bob", "alice", "Refonte", Locale.FRENCH);
        verify(mailService).sendProjectInvitation("carol@mura.test", "carol", "alice", "Refonte", Locale.FRENCH);
    }

    @Test
    void readingTheProjectsInvitationsExpiresTheLapsedOnes() {
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), alice.getId())).thenReturn(true);
        ProjectInvitation lapsed = invitation(InvitationStatus.PENDING, Instant.now().minus(Duration.ofDays(15)));
        when(invitationRepository.findAllOpenForProject(project.getId())).thenReturn(List.of(lapsed));

        assertThat(service.listOpenForProject(alice.getId(), project.getId()))
                .singleElement().satisfies(i -> assertThat(i.status()).isEqualTo(InvitationStatus.EXPIRED));
    }

    @Test
    void someoneOffTheTeamCannotReadItsInvitations() {
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), bob.getId())).thenReturn(false);

        assertThatThrownBy(() -> service.listOpenForProject(bob.getId(), project.getId()))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void myPendingListDropsWhatJustExpired() {
        ProjectInvitation fresh = pending();
        ProjectInvitation lapsed = invitation(InvitationStatus.PENDING, Instant.now().minus(Duration.ofDays(30)));
        when(invitationRepository.findAllForUser(bob.getId(), InvitationStatus.PENDING)).thenReturn(List.of(fresh, lapsed));

        assertThat(service.listPendingForUser(bob.getId())).extracting(InvitationResponse::id).containsExactly(fresh.getId());
    }

    @Test
    void acceptingMakesThemAMember() {
        ProjectInvitation invitation = pending();

        InvitationResponse response = service.accept(bob.getId(), invitation.getId());

        ArgumentCaptor<ProjectMember> member = ArgumentCaptor.forClass(ProjectMember.class);
        verify(projectMemberRepository).save(member.capture());
        assertThat(member.getValue().getRole()).isEqualTo(ProjectRole.MEMBER);
        assertThat(response.status()).isEqualTo(InvitationStatus.ACCEPTED);
        assertThat(invitation.getRespondedAt()).isNotNull();
    }

    @Test
    void acceptingWhenAlreadyOnTheTeamAddsNoSecondMembership() {
        ProjectInvitation invitation = pending();
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), bob.getId())).thenReturn(true);

        service.accept(bob.getId(), invitation.getId());

        verify(projectMemberRepository, never()).save(any());
    }

    @Test
    void onlyTheInviteeMayAnswer() {
        ProjectInvitation invitation = pending();

        assertThatThrownBy(() -> service.accept(alice.getId(), invitation.getId()))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThatThrownBy(() -> service.decline(alice.getId(), invitation.getId()))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void aLapsedOrAnsweredInvitationCannotBeAnswered() {
        ProjectInvitation lapsed = invitation(InvitationStatus.PENDING, Instant.now().minus(Duration.ofDays(15)));
        assertThatThrownBy(() -> service.accept(bob.getId(), lapsed.getId())).hasMessageContaining("expiré");

        ProjectInvitation declined = invitation(InvitationStatus.DECLINED, Instant.now());
        assertThatThrownBy(() -> service.accept(bob.getId(), declined.getId()))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void decliningRecordsTheAnswer() {
        ProjectInvitation invitation = pending();

        assertThat(service.decline(bob.getId(), invitation.getId()).status()).isEqualTo(InvitationStatus.DECLINED);
    }

    @Test
    void cancellingDeletesAPendingInvitationOfThisProject() {
        ProjectInvitation invitation = pending();

        service.cancel(alice.getId(), project.getId(), invitation.getId());

        verify(invitationRepository).delete(invitation);
    }

    @Test
    void cancellingAnInvitationOfAnotherProjectIsNotFound() {
        Project other = Fixtures.project("Autre", alice);
        when(projectRepository.findById(other.getId())).thenReturn(Optional.of(other));
        when(projectMemberRepository.findByProjectIdAndUserId(other.getId(), alice.getId()))
                .thenReturn(Optional.of(Fixtures.member(other, alice, ProjectRole.OWNER)));
        ProjectInvitation invitation = pending();

        assertThatThrownBy(() -> service.cancel(alice.getId(), other.getId(), invitation.getId()))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(invitationRepository, never()).delete(any(ProjectInvitation.class));
    }

    @Test
    void readingIsStampedOnceAndDismissingCountsAsReading() {
        ProjectInvitation invitation = pending();

        assertThat(service.markRead(bob.getId(), invitation.getId()).read()).isTrue();
        Instant firstRead = invitation.getReadAt();
        service.markRead(bob.getId(), invitation.getId());
        assertThat(invitation.getReadAt()).isEqualTo(firstRead);

        ProjectInvitation other = pending();
        InvitationResponse dismissed = service.dismiss(bob.getId(), other.getId());
        assertThat(dismissed.dismissed()).isTrue();
        assertThat(dismissed.read()).isTrue();
        assertThat(dismissed.status()).isEqualTo(InvitationStatus.PENDING);
    }

    @Test
    void onlyTheInviteeMayReadOrDismissTheirNotification() {
        ProjectInvitation invitation = pending();

        assertThatThrownBy(() -> service.markRead(alice.getId(), invitation.getId()))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        verify(mailService, never()).sendProjectInvitation(anyString(), anyString(), anyString(), anyString(), any());
    }
}
