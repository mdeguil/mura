package io.mura.admin;

import io.mura.admin.dto.AdminGroupResponse;
import io.mura.admin.dto.SaveAdminGroupRequest;
import io.mura.common.exception.ApiException;
import io.mura.group.UserGroup;
import io.mura.group.UserGroupMember;
import io.mura.group.UserGroupMemberRepository;
import io.mura.group.UserGroupRepository;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.notification.NotificationService;
import io.mura.notification.NotificationType;
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
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AdminGroupServiceTest {

    @Mock
    private UserGroupRepository groupRepository;
    @Mock
    private UserGroupMemberRepository memberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;
    @InjectMocks
    private AdminGroupService service;

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
        when(memberRepository.save(any(UserGroupMember.class))).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void listSortsByNameAndLoadsEveryGroupsMembersInOneQuery() {
        UserGroup zeta = Fixtures.group("zeta", alice);
        UserGroup alpha = Fixtures.group("Alpha", bob);
        when(groupRepository.findAll()).thenReturn(List.of(zeta, alpha));
        when(memberRepository.findAllForGroups(anyList())).thenReturn(List.of(
                Fixtures.groupMember(zeta, alice), Fixtures.groupMember(zeta, bob), Fixtures.groupMember(alpha, bob)));

        List<AdminGroupResponse> groups = service.list();

        assertThat(groups).extracting(AdminGroupResponse::name, AdminGroupResponse::memberCount)
                .containsExactly(org.assertj.core.groups.Tuple.tuple("Alpha", 1L), org.assertj.core.groups.Tuple.tuple("zeta", 2L));
        verify(memberRepository).findAllForGroups(anyList());
    }

    @Test
    void anEmptyListAsksNothingMore() {
        when(groupRepository.findAll()).thenReturn(List.of());

        assertThat(service.list()).isEmpty();
        verify(memberRepository, never()).findAllForGroups(anyList());
    }

    @Test
    void creatingPutsTheGerantInTheirGroupAndTellsThem() {
        AdminGroupResponse created = service.create(admin.getId(), new SaveAdminGroupRequest(" Design ", alice.getId()));

        ArgumentCaptor<UserGroup> group = ArgumentCaptor.forClass(UserGroup.class);
        verify(groupRepository).save(group.capture());
        assertThat(group.getValue().getName()).isEqualTo("Design");
        assertThat(group.getValue().getOwner()).isEqualTo(alice);
        assertThat(created.members()).extracting(m -> m.username()).containsExactly("alice");
        verify(notificationService).notifyAboutGroup(alice, NotificationType.GROUP_ENTRUSTED, group.getValue(), admin);
    }

    @Test
    void anAdministratorMakingThemselfGerantIsNotToldWhatTheyJustDid() {
        service.create(admin.getId(), new SaveAdminGroupRequest("Design", admin.getId()));

        verifyNoInteractions(notificationService);
    }

    @Test
    void handingOverTellsBothSidesAndKeepsThePreviousGerantAsMember() {
        UserGroup group = Fixtures.group("Design", alice);
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(memberRepository.existsByGroupIdAndUserId(group.getId(), bob.getId())).thenReturn(false);
        when(memberRepository.findAllForGroups(List.of(group.getId()))).thenReturn(List.of(
                Fixtures.groupMember(group, alice), Fixtures.groupMember(group, bob)));

        service.update(admin.getId(), group.getId(), new SaveAdminGroupRequest("Design", bob.getId()));

        assertThat(group.getOwner()).isEqualTo(bob);
        verify(memberRepository).save(any(UserGroupMember.class));
        verify(notificationService).notifyAboutGroup(bob, NotificationType.GROUP_ENTRUSTED, group, admin);
        verify(notificationService).notifyAboutGroup(alice, NotificationType.GROUP_MANAGER_CHANGED, group, bob);
    }

    @Test
    void renamingWithoutAHandoverTellsNobody() {
        UserGroup group = Fixtures.group("Design", alice);
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(memberRepository.findAllForGroups(List.of(group.getId()))).thenReturn(List.of());

        service.update(admin.getId(), group.getId(), new SaveAdminGroupRequest("Pôle design", alice.getId()));

        assertThat(group.getName()).isEqualTo("Pôle design");
        verifyNoInteractions(notificationService);
    }

    @Test
    void deletingTellsEveryMemberButTheAdministratorAndChecksTheRowIsGone() {
        UserGroup group = Fixtures.group("Design", alice);
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(memberRepository.findAllForGroups(List.of(group.getId()))).thenReturn(List.of(
                Fixtures.groupMember(group, alice), Fixtures.groupMember(group, admin)));
        when(groupRepository.deleteGroupById(group.getId())).thenReturn(1);

        service.delete(admin.getId(), group.getId());

        verify(notificationService).notifyAboutFormerGroup(alice, NotificationType.GROUP_DELETED, "Design", admin);
        verify(notificationService, never()).notifyAboutFormerGroup(eq(admin), any(), any(), any());
    }

    @Test
    void aDeleteThatRemovedNothingIsAnError() {
        UserGroup group = Fixtures.group("Design", alice);
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
        when(memberRepository.findAllForGroups(List.of(group.getId()))).thenReturn(List.of());
        when(groupRepository.deleteGroupById(group.getId())).thenReturn(0);

        assertThat(catchThrowable(() -> service.delete(admin.getId(), group.getId())))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR));
    }

    @Test
    void anUnknownGerantIsRefusedOnItsField() {
        java.util.UUID unknown = java.util.UUID.randomUUID();
        when(userRepository.findById(unknown)).thenReturn(Optional.empty());

        assertThat(catchThrowable(() -> service.create(admin.getId(), new SaveAdminGroupRequest("Design", unknown))))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(e.getField()).isEqualTo("managerId");
                });
    }
}
