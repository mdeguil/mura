package io.mura.project;

import io.mura.common.exception.ApiException;
import io.mura.group.UserGroup;
import io.mura.group.UserGroupMember;
import io.mura.group.UserGroupMemberRepository;
import io.mura.group.UserGroupRepository;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.notification.NotificationService;
import io.mura.notification.NotificationType;
import io.mura.project.dto.CreateProjectRequest;
import io.mura.project.dto.MemberResponse;
import io.mura.project.dto.ProjectResponse;
import io.mura.project.dto.UpdateProjectRequest;
import io.mura.support.Fixtures;
import io.mura.task.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectTypeService projectTypeService;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private ProjectInvitationRepository invitationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TaskService taskService;
    @Mock
    private InvitationService invitationService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private UserGroupRepository groupRepository;
    @Mock
    private UserGroupMemberRepository groupMemberRepository;

    private ProjectService service;

    private User alice;
    private User bob;
    private User carol;
    private Project project;
    private ProjectMember aliceOwner;
    private ProjectMember bobMember;

    @BeforeEach
    void setUp() {
        service = new ProjectService(projectRepository, new ProjectAccessGuard(projectRepository, projectMemberRepository),
                projectTypeService, projectMemberRepository, invitationRepository, userRepository, taskService,
                invitationService, notificationService, groupRepository, groupMemberRepository);
        alice = Fixtures.user("alice");
        bob = Fixtures.user("bob");
        carol = Fixtures.user("carol");
        project = Fixtures.project("Refonte", alice);
        aliceOwner = Fixtures.member(project, alice, ProjectRole.OWNER);
        bobMember = Fixtures.member(project, bob, ProjectRole.MEMBER);

        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(projectRepository.existsById(project.getId())).thenReturn(true);
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), alice.getId())).thenReturn(Optional.of(aliceOwner));
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), bob.getId())).thenReturn(Optional.of(bobMember));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), alice.getId())).thenReturn(true);
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), bob.getId())).thenReturn(true);
        when(projectMemberRepository.findAllForProject(project.getId())).thenReturn(List.of(aliceOwner, bobMember));
        when(projectMemberRepository.findUserIdsByProjectId(project.getId())).thenReturn(Set.of(alice.getId(), bob.getId()));
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(userRepository.findById(bob.getId())).thenReturn(Optional.of(bob));
    }

    private static void assertStatus(Throwable thrown, HttpStatus status) {
        assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getStatus()).isEqualTo(status));
    }

    @Nested
    class Reading {

        @Test
        void listForUserGivesEachProjectItsOwnTeam() {
            Project other = Fixtures.project("Autre", bob);
            when(projectRepository.findAllForMember(alice.getId())).thenReturn(List.of(project, other));
            when(projectMemberRepository.findAllForProjects(anyList())).thenReturn(List.of(
                    aliceOwner, bobMember, Fixtures.member(other, bob, ProjectRole.OWNER)));

            List<ProjectResponse> projects = service.listForUser(alice.getId());

            assertThat(projects).extracting(p -> p.members().size()).containsExactly(2, 1);
        }

        @Test
        void listForUserWithNoProjectAsksNothingMore() {
            when(projectRepository.findAllForMember(alice.getId())).thenReturn(List.of());

            assertThat(service.listForUser(alice.getId())).isEmpty();
            verify(projectMemberRepository, never()).findAllForProjects(anyList());
        }

        @Test
        void aMemberSeesTheTeamWithTheirAddresses() {
            ProjectResponse response = service.getForUser(bob.getId(), project.getId());

            assertThat(response.access()).isEqualTo(ProjectAccess.MEMBER);
            assertThat(response.members()).allSatisfy(m -> assertThat(m.email()).isNotNull());
        }

        @Test
        void someoneOnlyInvitedSeesTheTeamWithoutAddresses() {
            when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), carol.getId())).thenReturn(false);
            when(invitationRepository.existsByProjectIdAndInvitedUserIdAndStatus(project.getId(), carol.getId(), InvitationStatus.PENDING))
                    .thenReturn(true);

            ProjectResponse response = service.getForUser(carol.getId(), project.getId());

            assertThat(response.access()).isEqualTo(ProjectAccess.INVITED);
            assertThat(response.members()).allSatisfy(m -> assertThat(m.email()).isNull());
        }

        @Test
        void anyoneElseIsRefusedAndAnUnknownProjectIsNotFound() {
            when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), carol.getId())).thenReturn(false);
            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.getForUser(carol.getId(), project.getId())), HttpStatus.FORBIDDEN);

            UUID unknown = UUID.randomUUID();
            when(projectRepository.findById(unknown)).thenReturn(Optional.empty());
            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.getForUser(alice.getId(), unknown)), HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    class Editing {

        private UpdateProjectRequest request(ProjectStatus status, String color) {
            return new UpdateProjectRequest("Refonte v2", "Nouvelle", color, project.getType().getId(), null, status);
        }

        @BeforeEach
        void typeExists() {
            when(projectTypeService.require(project.getType().getId())).thenReturn(project.getType());
        }

        @Test
        void aPlainMemberCannotEdit() {
            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.update(bob.getId(), project.getId(), request(ProjectStatus.EN_COURS, null))), HttpStatus.FORBIDDEN);
        }

        @Test
        void anEmptyColourFallsBackToTheDefault() {
            assertThat(service.update(alice.getId(), project.getId(), request(ProjectStatus.A_VENIR, " ")).color())
                    .isEqualTo("#14b8a6");
        }

        @Test
        void reachingAcheveStampsTheDateAndLeavingItClearsIt() {
            service.update(alice.getId(), project.getId(), request(ProjectStatus.ACHEVE, "#ff0000"));
            Instant completed = project.getCompletedAt();
            assertThat(completed).isNotNull();

            service.update(alice.getId(), project.getId(), request(ProjectStatus.ACHEVE, "#ff0000"));
            assertThat(project.getCompletedAt()).isEqualTo(completed);

            service.update(alice.getId(), project.getId(), request(ProjectStatus.EN_COURS, "#ff0000"));
            assertThat(project.getCompletedAt()).isNull();
        }

        @Test
        void onlyTheOwnerArchivesRestoresOrDeletes() {
            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.archive(bob.getId(), project.getId())), HttpStatus.FORBIDDEN);

            assertThat(service.archive(alice.getId(), project.getId()).archived()).isTrue();
            assertThat(service.restore(alice.getId(), project.getId()).archived()).isFalse();
        }

        @Test
        void aProjectMustBeArchivedBeforeItIsDeleted() {
            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.delete(alice.getId(), project.getId())), HttpStatus.CONFLICT);
            verify(projectRepository, never()).delete(any());

            project.setArchived(true);
            service.delete(alice.getId(), project.getId());
            verify(projectRepository).delete(project);
        }
    }

    @Nested
    class Creating {

        private UserGroup group;

        @BeforeEach
        void typeAndGroupExist() {
            when(projectTypeService.require(any())).thenReturn(Fixtures.type("Web"));
            group = Fixtures.group("Design", alice);
            when(groupRepository.existsById(group.getId())).thenReturn(true);
            when(groupMemberRepository.existsByGroupIdAndUserId(group.getId(), alice.getId())).thenReturn(true);
            when(projectMemberRepository.findUserIdsByProjectId(any())).thenReturn(Set.of(alice.getId()));
        }

        private CreateProjectRequest request(List<String> invited, UUID groupId) {
            return new CreateProjectRequest("Nouveau", null, null, UUID.randomUUID(), null, invited, groupId);
        }

        @Test
        void theCreatorIsItsOwnerAndTheListedPeopleAreInvited() {
            service.create(alice.getId(), request(List.of("bob@mura.test"), null));

            ArgumentCaptor<ProjectMember> membership = ArgumentCaptor.forClass(ProjectMember.class);
            verify(projectMemberRepository).save(membership.capture());
            assertThat(membership.getValue().getRole()).isEqualTo(ProjectRole.OWNER);
            assertThat(membership.getValue().getUser()).isEqualTo(alice);
            verify(invitationService).inviteAll(any(Project.class), eq(alice), eq(List.of("bob@mura.test")));
        }

        @Test
        void aGroupsPeopleJoinAndAreNotAlsoInvited() {
            when(groupMemberRepository.findAllForGroups(List.of(group.getId()))).thenReturn(List.of(
                    Fixtures.groupMember(group, alice), Fixtures.groupMember(group, bob)));

            service.create(alice.getId(), request(List.of("BOB@mura.test", "carol@mura.test"), group.getId()));

            verify(invitationService).inviteAll(any(Project.class), eq(alice), eq(List.of("carol@mura.test")));
            verify(notificationService).notify(eq(bob), eq(NotificationType.ADDED_TO_PROJECT), any(Project.class), eq(alice), eq(null));
        }

        @Test
        void aGroupTheCreatorIsNotInStopsTheCreationBeforeAnyInvitation() {
            when(groupMemberRepository.existsByGroupIdAndUserId(group.getId(), alice.getId())).thenReturn(false);

            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.create(alice.getId(), request(List.of("carol@mura.test"), group.getId()))), HttpStatus.FORBIDDEN);
            verify(invitationService, never()).inviteAll(any(), any(), any());
            verify(notificationService, never()).notify(any(), any(), any(), any(), any());
        }
    }

    @Nested
    class Roles {

        @Test
        void theOwnerPromotesAMemberToAdmin() {
            MemberResponse changed = service.changeRole(alice.getId(), project.getId(), bob.getId(), ProjectRole.ADMIN);

            assertThat(changed.role()).isEqualTo(ProjectRole.ADMIN);
        }

        @Test
        void ownershipIsNeverGivenByAChangeOfRoleAndTheOwnerKeepsTheirs() {
            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.changeRole(alice.getId(), project.getId(), bob.getId(), ProjectRole.OWNER)), HttpStatus.CONFLICT);
            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.changeRole(alice.getId(), project.getId(), alice.getId(), ProjectRole.MEMBER)), HttpStatus.CONFLICT);
        }

        @Test
        void onlyTheOwnerChangesRoles() {
            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.changeRole(bob.getId(), project.getId(), alice.getId(), ProjectRole.MEMBER)), HttpStatus.FORBIDDEN);
        }

        @Test
        void transferringMakesTheSuccessorOwnerAndKeepsThePreviousOneAsAdmin() {
            service.transferOwnership(alice.getId(), project.getId(), bob.getId());

            assertThat(bobMember.getRole()).isEqualTo(ProjectRole.OWNER);
            assertThat(aliceOwner.getRole()).isEqualTo(ProjectRole.ADMIN);
            assertThat(project.getOwner()).isEqualTo(bob);
        }

        @Test
        void transferringToYourselfIsRefused() {
            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.transferOwnership(alice.getId(), project.getId(), alice.getId())), HttpStatus.CONFLICT);
        }
    }

    @Nested
    class Leaving {

        @Test
        void aMemberLeavingTellsTheManagersButNotThemself() {
            ProjectMember admin = Fixtures.member(project, carol, ProjectRole.ADMIN);
            when(projectMemberRepository.findAllForProject(project.getId())).thenReturn(List.of(aliceOwner, bobMember, admin));

            service.removeMember(bob.getId(), project.getId(), bob.getId(), "Je change d'équipe");

            verify(taskService).unassignMember(project.getId(), bob.getId());
            verify(projectMemberRepository).delete(bobMember);
            verify(notificationService).notify(alice, NotificationType.MEMBER_LEFT_PROJECT, project, bob, "Je change d'équipe");
            verify(notificationService).notify(carol, NotificationType.MEMBER_LEFT_PROJECT, project, bob, "Je change d'équipe");
            verify(notificationService, never()).notify(eq(bob), any(), any(), any(), any());
        }

        @Test
        void theOwnerRemovingSomeoneTellsThem() {
            service.removeMember(alice.getId(), project.getId(), bob.getId(), null);

            verify(notificationService).notify(bob, NotificationType.REMOVED_FROM_PROJECT, project, alice, null);
        }

        @Test
        void theOwnerCannotBeRemovedOrLeaveWithoutHandingOver() {
            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.removeMember(alice.getId(), project.getId(), alice.getId(), null)), HttpStatus.CONFLICT);
        }

        @Test
        void anAdminCanRemoveMembersButNotAnotherAdmin() {
            ProjectMember carolAdmin = Fixtures.member(project, carol, ProjectRole.ADMIN);
            when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), carol.getId())).thenReturn(Optional.of(carolAdmin));
            when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), carol.getId())).thenReturn(true);
            bobMember.setRole(ProjectRole.ADMIN);

            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.removeMember(carol.getId(), project.getId(), bob.getId(), null)), HttpStatus.FORBIDDEN);
            verify(projectMemberRepository, never()).delete(any());
        }

        @Test
        void aPlainMemberCannotRemoveSomeoneElse() {
            when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), carol.getId()))
                    .thenReturn(Optional.of(Fixtures.member(project, carol, ProjectRole.MEMBER)));

            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.removeMember(bob.getId(), project.getId(), carol.getId(), null)), HttpStatus.FORBIDDEN);
        }
    }

    @Nested
    class BringingAGroup {

        private UserGroup group;

        @BeforeEach
        void groupWithAliceIn() {
            group = Fixtures.group("Design", alice);
            when(groupRepository.existsById(group.getId())).thenReturn(true);
            when(groupMemberRepository.existsByGroupIdAndUserId(group.getId(), alice.getId())).thenReturn(true);
        }

        @Test
        void everyoneWhoCanComeJoinsAndIsTold() {
            User dave = Fixtures.user("dave");
            UserGroupMember onHold = Fixtures.groupMember(group, Fixtures.user("eve"));
            onHold.setOnHoldAt(Instant.now());
            when(groupMemberRepository.findAllForGroups(List.of(group.getId()))).thenReturn(List.of(
                    Fixtures.groupMember(group, alice),
                    Fixtures.groupMember(group, bob),
                    Fixtures.groupMember(group, carol),
                    Fixtures.groupMember(group, Fixtures.suspended(dave)),
                    onHold));

            service.addFromGroup(alice.getId(), project.getId(), group.getId());

            @SuppressWarnings("unchecked")
            ArgumentCaptor<List<ProjectMember>> joined = ArgumentCaptor.forClass(List.class);
            verify(projectMemberRepository).saveAll(joined.capture());
            assertThat(joined.getValue()).extracting(m -> m.getUser().getUsername()).containsExactly("carol");
            verify(notificationService).notify(carol, NotificationType.ADDED_TO_PROJECT, project, alice, null);
            verify(invitationRepository).deleteOutstandingFor(project.getId(), List.of(carol.getId()));
        }

        @Test
        void aGroupThatWouldBringNobodyIsRefused() {
            when(groupMemberRepository.findAllForGroups(List.of(group.getId())))
                    .thenReturn(List.of(Fixtures.groupMember(group, alice), Fixtures.groupMember(group, bob)));

            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.addFromGroup(alice.getId(), project.getId(), group.getId())), HttpStatus.CONFLICT);
        }

        @Test
        void onlyAManagerWhoIsInTheGroupMayBringIt() {
            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.addFromGroup(bob.getId(), project.getId(), group.getId())), HttpStatus.FORBIDDEN);

            when(groupMemberRepository.existsByGroupIdAndUserId(group.getId(), alice.getId())).thenReturn(false);
            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.addFromGroup(alice.getId(), project.getId(), group.getId())), HttpStatus.FORBIDDEN);
        }

        @Test
        void anUnknownGroupIsNotFound() {
            UUID unknown = UUID.randomUUID();
            when(groupRepository.existsById(unknown)).thenReturn(false);

            assertStatus(org.assertj.core.api.Assertions.catchThrowable(
                    () -> service.addFromGroup(alice.getId(), project.getId(), unknown)), HttpStatus.NOT_FOUND);
        }
    }
}
