package io.mura.admin;

import io.mura.admin.dto.AccountDeletionPreview;
import io.mura.admin.dto.ChangeAccountRoleRequest;
import io.mura.common.exception.ApiException;
import io.mura.group.UserGroup;
import io.mura.group.UserGroupRepository;
import io.mura.member.AccountRole;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.member.dto.AccountResponse;
import io.mura.notification.NotificationService;
import io.mura.notification.NotificationType;
import io.mura.project.Project;
import io.mura.project.ProjectMember;
import io.mura.project.ProjectMemberRepository;
import io.mura.project.ProjectRepository;
import io.mura.project.ProjectRole;
import io.mura.support.Fixtures;
import io.mura.task.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AccountServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private UserGroupRepository userGroupRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private PasswordEncoder passwordEncoder;
    @InjectMocks
    private AccountService service;

    private User admin;
    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        admin = Fixtures.admin("admin");
        alice = Fixtures.user("alice");
        bob = Fixtures.user("bob");
        for (User user : List.of(admin, alice, bob)) {
            when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        }
        when(userRepository.findAll()).thenReturn(List.of(alice, admin, bob));
        when(userGroupRepository.findAllForMember(any())).thenReturn(List.of());
        when(projectRepository.findAllForMember(any())).thenReturn(List.of());
        when(projectRepository.findAllByOwnerId(any())).thenReturn(List.of());
        when(userGroupRepository.findAllByOwnerId(any())).thenReturn(List.of());
    }

    private static void assertStatus(Throwable thrown, HttpStatus status) {
        assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(status));
    }

    @Test
    void theAdministrationIsClosedToOrdinaryAccounts() {
        assertStatus(catchThrowable(() -> service.list(alice.getId())), HttpStatus.FORBIDDEN);
        assertStatus(catchThrowable(() -> service.setSuspended(alice.getId(), bob.getId(), true)), HttpStatus.FORBIDDEN);
    }

    @Test
    void listPutsAdministratorsFirstThenAlphabetical() {
        assertThat(service.list(admin.getId())).extracting(AccountResponse::username)
                .containsExactly("admin", "alice", "bob");
    }

    @Test
    void promotingAndDemotingAnAccount() {
        assertThat(service.changeRole(admin.getId(), alice.getId(), new ChangeAccountRoleRequest(AccountRole.ADMIN))
                .accountRole()).isEqualTo(AccountRole.ADMIN);
        when(userRepository.findAll()).thenReturn(List.of(alice, admin, bob));
        assertThat(service.changeRole(admin.getId(), alice.getId(), new ChangeAccountRoleRequest(AccountRole.USER))
                .accountRole()).isEqualTo(AccountRole.USER);
    }

    @Test
    void theLastActiveAdministratorCannotStepDown() {
        assertStatus(catchThrowable(() -> service.changeRole(admin.getId(), admin.getId(),
                new ChangeAccountRoleRequest(AccountRole.USER))), HttpStatus.CONFLICT);
        assertThat(admin.getAccountRole()).isEqualTo(AccountRole.ADMIN);
    }

    @Test
    void aSuspendedAdministratorDoesNotCountAsAWayBackIn() {
        User other = Fixtures.suspended(Fixtures.admin("other"));
        when(userRepository.findAll()).thenReturn(List.of(admin, other));

        assertStatus(catchThrowable(() -> service.changeRole(admin.getId(), admin.getId(),
                new ChangeAccountRoleRequest(AccountRole.USER))), HttpStatus.CONFLICT);
    }

    @Test
    void anAdministratorCannotSuspendThemself() {
        assertStatus(catchThrowable(() -> service.setSuspended(admin.getId(), admin.getId(), true)), HttpStatus.CONFLICT);
    }

    @Test
    void suspendingTellsTheOwnersOfTheirProjectsAndGroupsButNotTheAdministrator() {
        Project aliceProject = Fixtures.project("Refonte", alice);
        Project adminProject = Fixtures.project("Admin", admin);
        UserGroup aliceGroup = Fixtures.group("Design", alice);
        when(projectRepository.findAllForMember(bob.getId())).thenReturn(List.of(aliceProject, adminProject));
        when(userGroupRepository.findAllForMember(bob.getId())).thenReturn(List.of(aliceGroup));

        AccountResponse response = service.setSuspended(admin.getId(), bob.getId(), true);

        assertThat(response.suspended()).isTrue();
        verify(notificationService).notify(alice, NotificationType.MEMBER_SUSPENDED, aliceProject, bob, null);
        verify(notificationService).notifyAboutGroup(alice, NotificationType.MEMBER_SUSPENDED, aliceGroup, bob);
        verify(notificationService, never()).notify(eq(admin), any(), any(), any(), any());
    }

    @Test
    void resendingTheSameStateChangesNothingAndTellsNobody() {
        service.setSuspended(admin.getId(), bob.getId(), false);

        verify(notificationService, never()).notify(any(), any(), any(), any(), any());
        verify(notificationService, never()).notifyAboutGroup(any(), any(), any(), any());
    }

    @Test
    void liftingASuspensionTellsTheOwnersItIsLifted() {
        Fixtures.suspended(bob);
        Project aliceProject = Fixtures.project("Refonte", alice);
        when(projectRepository.findAllForMember(bob.getId())).thenReturn(List.of(aliceProject));

        assertThat(service.setSuspended(admin.getId(), bob.getId(), false).suspended()).isFalse();
        verify(notificationService).notify(alice, NotificationType.MEMBER_RESTORED, aliceProject, bob, null);
    }

    @Test
    void thePreviewNamesWhatPassesOnAndWhatGoes() {
        Project shared = Fixtures.project("Partagé", bob);
        Project alone = Fixtures.project("Seul", bob);
        when(projectRepository.findAllByOwnerId(bob.getId())).thenReturn(List.of(shared, alone));
        ProjectMember aliceAdmin = Fixtures.member(shared, alice, ProjectRole.ADMIN);
        when(projectMemberRepository.findAllForProject(shared.getId()))
                .thenReturn(List.of(Fixtures.member(shared, bob, ProjectRole.OWNER), aliceAdmin));
        when(projectMemberRepository.findAllForProject(alone.getId()))
                .thenReturn(List.of(Fixtures.member(alone, bob, ProjectRole.OWNER)));
        when(userGroupRepository.findAllByOwnerId(bob.getId())).thenReturn(List.of(Fixtures.group("Design", bob)));
        when(taskRepository.countByAssigneeId(bob.getId())).thenReturn(3L);

        AccountDeletionPreview preview = service.deletionPreview(admin.getId(), bob.getId());

        assertThat(preview.projectsTransferred()).singleElement().satisfies(handover -> {
            assertThat(handover.projectName()).isEqualTo("Partagé");
            assertThat(handover.successorUsername()).isEqualTo("alice");
        });
        assertThat(preview.projectsDeleted()).containsExactly("Seul");
        assertThat(preview.groupsDeleted()).containsExactly("Design");
        assertThat(preview.tasksUnassigned()).isEqualTo(3);
    }

    @Test
    void theSuccessorIsAManagerBeforeTheLongestServingMember() {
        Project shared = Fixtures.project("Partagé", bob);
        when(projectRepository.findAllByOwnerId(bob.getId())).thenReturn(List.of(shared));
        User carol = Fixtures.user("carol");
        ProjectMember veteran = Fixtures.member(shared, carol, ProjectRole.MEMBER);
        veteran.setJoinedAt(Instant.parse("2025-01-01T00:00:00Z"));
        ProjectMember admin2 = Fixtures.member(shared, alice, ProjectRole.ADMIN);
        admin2.setJoinedAt(Instant.parse("2026-06-01T00:00:00Z"));
        when(projectMemberRepository.findAllForProject(shared.getId())).thenReturn(List.of(veteran, admin2));

        assertThat(service.deletionPreview(admin.getId(), bob.getId()).projectsTransferred())
                .singleElement().satisfies(h -> assertThat(h.successorUsername()).isEqualTo("alice"));
    }

    @Test
    void anAdministratorDeletesOnlyASuspendedAccountAndNeverTheirOwn() {
        assertStatus(catchThrowable(() -> service.delete(admin.getId(), bob.getId())), HttpStatus.CONFLICT);
        assertStatus(catchThrowable(() -> service.delete(admin.getId(), admin.getId())), HttpStatus.CONFLICT);
        verify(userRepository, never()).deleteAccountById(any());
    }

    @Test
    void deletingHandsSharedProjectsOverThenRemovesTheAccount() {
        Fixtures.suspended(bob);
        Project shared = Fixtures.project("Partagé", bob);
        when(projectRepository.findAllByOwnerId(bob.getId())).thenReturn(List.of(shared));
        ProjectMember bobOwner = Fixtures.member(shared, bob, ProjectRole.OWNER);
        ProjectMember aliceMember = Fixtures.member(shared, alice, ProjectRole.MEMBER);
        when(projectMemberRepository.findAllForProject(shared.getId())).thenReturn(List.of(bobOwner, aliceMember));

        service.delete(admin.getId(), bob.getId());

        assertThat(shared.getOwner()).isEqualTo(alice);
        assertThat(aliceMember.getRole()).isEqualTo(ProjectRole.OWNER);
        verify(notificationService).notify(alice, NotificationType.MEMBER_DELETED, shared, bob,
                "Tu es maintenant propriétaire de ce projet.");
        verify(userRepository).deleteAccountById(bob.getId());
    }

    @Test
    void closingYourOwnAccountTakesYourPassword() {
        when(passwordEncoder.matches("faux", alice.getPassword())).thenReturn(false);

        assertThat(catchThrowable(() -> service.deleteOwn(alice.getId(), "faux")))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    assertThat(e.getField()).isEqualTo("password");
                });
        verify(userRepository, never()).deleteAccountById(any());
    }

    @Test
    void closingYourOwnAccountNeedsNoSuspension() {
        when(passwordEncoder.matches("bon", alice.getPassword())).thenReturn(true);

        service.deleteOwn(alice.getId(), "bon");

        verify(userRepository).deleteAccountById(alice.getId());
    }

    @Test
    void theLastActiveAdministratorCannotCloseTheirAccount() {
        when(passwordEncoder.matches("bon", admin.getPassword())).thenReturn(true);

        assertStatus(catchThrowable(() -> service.deleteOwn(admin.getId(), "bon")), HttpStatus.CONFLICT);
        verify(userRepository, never()).deleteAccountById(any());
    }

    @Test
    void yourOwnPreviewNeedsNoAdministration() {
        assertThat(service.ownDeletionPreview(alice.getId()).username()).isEqualTo("alice");
    }
}
