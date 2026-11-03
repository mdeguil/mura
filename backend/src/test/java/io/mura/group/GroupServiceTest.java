package io.mura.group;

import io.mura.common.exception.ApiException;
import io.mura.group.dto.AddGroupMemberRequest;
import io.mura.group.dto.GroupResponse;
import io.mura.group.dto.SaveGroupRequest;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.notification.NotificationService;
import io.mura.notification.NotificationType;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock
    private UserGroupRepository groupRepository;
    @Mock
    private UserGroupMemberRepository memberRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private NotificationService notificationService;
    @InjectMocks
    private GroupService service;

    private User alice;
    private User bob;
    private UserGroup group;

    @BeforeEach
    void setUp() {
        alice = Fixtures.user("alice");
        bob = Fixtures.user("bob");
        group = Fixtures.group("Design", alice);
    }

    private void groupExists() {
        when(groupRepository.findById(group.getId())).thenReturn(Optional.of(group));
    }

    private UserGroupMember bobIsIn() {
        UserGroupMember membership = Fixtures.groupMember(group, bob);
        when(memberRepository.findByGroupIdAndUserId(group.getId(), bob.getId())).thenReturn(Optional.of(membership));
        return membership;
    }

    @Test
    void listForUserBuildsEachGroupWithItsOwnMembers() {
        UserGroup other = Fixtures.group("Dev", bob);
        when(groupRepository.findAllForMember(alice.getId())).thenReturn(List.of(group, other));
        when(memberRepository.findAllForGroups(anyList())).thenReturn(List.of(
                Fixtures.groupMember(group, alice), Fixtures.groupMember(group, bob), Fixtures.groupMember(other, alice)));

        List<GroupResponse> groups = service.listForUser(alice.getId());

        assertThat(groups).extracting(GroupResponse::name).containsExactly("Design", "Dev");
        assertThat(groups.get(0).members()).hasSize(2);
        assertThat(groups.get(0).owned()).isTrue();
        assertThat(groups.get(1).owned()).isFalse();
    }

    @Test
    void listForUserWithoutGroupsAsksNothingMore() {
        when(groupRepository.findAllForMember(alice.getId())).thenReturn(List.of());

        assertThat(service.listForUser(alice.getId())).isEmpty();
        verifyNoInteractions(memberRepository);
    }

    @Test
    void onlyAMemberMayOpenTheGroup() {
        groupExists();
        when(memberRepository.existsByGroupIdAndUserId(group.getId(), bob.getId())).thenReturn(false);

        assertThatThrownBy(() -> service.get(bob.getId(), group.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void onlyTheGerantMayRename() {
        groupExists();

        assertThatThrownBy(() -> service.rename(bob.getId(), group.getId(), new SaveGroupRequest("X")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        assertThat(group.getName()).isEqualTo("Design");
    }

    @Test
    void renameTrimsTheName() {
        groupExists();

        assertThat(service.rename(alice.getId(), group.getId(), new SaveGroupRequest("  Pôle design ")).name())
                .isEqualTo("Pôle design");
    }

    @Test
    void addMemberAddsOutrightAndTellsThem() {
        groupExists();
        when(userRepository.findByEmailIgnoreCase("bob@mura.test")).thenReturn(Optional.of(bob));
        when(memberRepository.existsByGroupIdAndUserId(group.getId(), bob.getId())).thenReturn(false);

        service.addMember(alice.getId(), group.getId(), new AddGroupMemberRequest(" bob@mura.test "));

        verify(memberRepository).save(any(UserGroupMember.class));
        verify(notificationService).notifyAboutGroup(bob, NotificationType.ADDED_TO_GROUP, group, alice);
    }

    @Test
    void addMemberRefusesAnUnknownAddressOrSomeoneAlreadyIn() {
        groupExists();
        when(userRepository.findByEmailIgnoreCase("nobody@mura.test")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.addMember(alice.getId(), group.getId(), new AddGroupMemberRequest("nobody@mura.test")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

        when(userRepository.findByEmailIgnoreCase("bob@mura.test")).thenReturn(Optional.of(bob));
        when(memberRepository.existsByGroupIdAndUserId(group.getId(), bob.getId())).thenReturn(true);
        assertThatThrownBy(() -> service.addMember(alice.getId(), group.getId(), new AddGroupMemberRequest("bob@mura.test")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
        verify(memberRepository, never()).save(any());
    }

    @Test
    void theGerantRemovingSomeoneTellsThePersonRemoved() {
        groupExists();
        UserGroupMember membership = bobIsIn();

        service.removeMember(alice.getId(), group.getId(), bob.getId());

        verify(memberRepository).delete(membership);
        verify(notificationService).notifyAboutFormerGroup(bob, NotificationType.REMOVED_FROM_GROUP, "Design", alice);
    }

    @Test
    void someoneLeavingTellsTheGerant() {
        groupExists();
        bobIsIn();

        service.removeMember(bob.getId(), group.getId(), bob.getId());

        verify(notificationService).notifyAboutGroup(alice, NotificationType.MEMBER_LEFT_GROUP, group, bob);
    }

    @Test
    void theGerantCannotLeaveTheirOwnGroup() {
        groupExists();

        assertThatThrownBy(() -> service.removeMember(alice.getId(), group.getId(), alice.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void aMemberCannotRemoveSomeoneElse() {
        groupExists();
        User carol = Fixtures.user("carol");

        assertThatThrownBy(() -> service.removeMember(bob.getId(), group.getId(), carol.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        verify(memberRepository, never()).delete(any());
    }

    @Test
    void settingAsideStampsTheMembershipAndTellsThemOnce() {
        groupExists();
        UserGroupMember membership = bobIsIn();

        service.setMemberHold(alice.getId(), group.getId(), bob.getId(), true);
        service.setMemberHold(alice.getId(), group.getId(), bob.getId(), true);

        assertThat(membership.isOnHold()).isTrue();
        verify(notificationService).notifyAboutGroup(bob, NotificationType.HELD_IN_GROUP, group, alice);
    }

    @Test
    void bringingBackClearsTheHold() {
        groupExists();
        UserGroupMember membership = bobIsIn();
        membership.setOnHoldAt(java.time.Instant.now());

        service.setMemberHold(alice.getId(), group.getId(), bob.getId(), false);

        assertThat(membership.isOnHold()).isFalse();
        verify(notificationService).notifyAboutGroup(bob, NotificationType.RESTORED_IN_GROUP, group, alice);
    }

    @Test
    void theGerantCannotSetThemselfAside() {
        groupExists();

        assertThatThrownBy(() -> service.setMemberHold(alice.getId(), group.getId(), alice.getId(), true))
                .isInstanceOf(ApiException.class);
    }

    @Test
    void deleteTellsEveryoneButTheGerantThenChecksTheRowIsGone() {
        groupExists();
        when(memberRepository.findAllForGroups(List.of(group.getId()))).thenReturn(List.of(
                Fixtures.groupMember(group, alice), Fixtures.groupMember(group, bob)));
        when(groupRepository.deleteGroupById(group.getId())).thenReturn(1);

        service.delete(alice.getId(), group.getId());

        verify(notificationService).notifyAboutFormerGroup(bob, NotificationType.GROUP_DELETED, "Design", alice);
        verify(notificationService, never()).notifyAboutFormerGroup(eq(alice), any(), any(), any());
    }

    @Test
    void aDeleteThatRemovedNothingIsAnErrorNotASuccess() {
        groupExists();
        when(memberRepository.findAllForGroups(List.of(group.getId()))).thenReturn(List.of());
        when(groupRepository.deleteGroupById(group.getId())).thenReturn(0);

        assertThatThrownBy(() -> service.delete(alice.getId(), group.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR));
    }

    @Test
    void anUnknownGroupIsNotFound() {
        UUID unknown = UUID.randomUUID();
        when(groupRepository.findById(unknown)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(alice.getId(), unknown))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }
}
