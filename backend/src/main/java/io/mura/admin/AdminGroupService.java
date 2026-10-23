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
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

// An administrator sets a group up and says who runs it. Who is in it stays
// the gérant's business: two people editing the same list is how a list
// stops meaning anything.
@Service
@RequiredArgsConstructor
public class AdminGroupService {

    private final UserGroupRepository groupRepository;
    private final UserGroupMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<AdminGroupResponse> list() {
        return groupRepository.findAll().stream()
                .sorted(Comparator.comparing(g -> g.getName().toLowerCase()))
                .map(group -> AdminGroupResponse.of(
                        group, memberRepository.countByGroupId(group.getId())))
                .toList();
    }

    @Transactional
    public AdminGroupResponse create(UUID actorId, SaveAdminGroupRequest request) {
        User actor = requireUser(actorId);
        User manager = requireUser(request.managerId());

        UserGroup group = new UserGroup();
        group.setName(request.name());
        group.setOwner(manager);
        groupRepository.save(group);

        // The gérant is in their own group: one they are not part of would
        // not appear in their carnet, which is where they manage it from.
        memberRepository.save(new UserGroupMember(group, manager));

        // A group appearing in your carnet with your name on it, out of
        // nowhere, deserves an explanation. The administrator is named here
        // -- unlike a suspension, this is an organisational decision, and
        // knowing who made it is the whole point of being told.
        if (!manager.getId().equals(actorId)) {
            notificationService.notifyAboutGroup(
                    manager, NotificationType.GROUP_ENTRUSTED, group, actor);
        }

        return AdminGroupResponse.of(group, 1L);
    }

    @Transactional
    public AdminGroupResponse update(UUID actorId, UUID groupId, SaveAdminGroupRequest request) {
        User actor = requireUser(actorId);
        UserGroup group = require(groupId);
        User manager = requireUser(request.managerId());
        User previous = group.getOwner();

        group.setName(request.name());

        if (!previous.getId().equals(manager.getId())) {
            group.setOwner(manager);
            // Handing a group over puts the new gérant in it, for the same
            // reason creating one does. The previous one stays a member:
            // losing the group entirely is not what changing its gérant
            // was meant to do.
            if (!memberRepository.existsByGroupIdAndUserId(groupId, manager.getId())) {
                memberRepository.save(new UserGroupMember(group, manager));
            }

            // Both sides of the handover are told, and each is told the half
            // that concerns them: one has a group to run, the other no
            // longer has.
            if (!manager.getId().equals(actorId)) {
                notificationService.notifyAboutGroup(
                        manager, NotificationType.GROUP_ENTRUSTED, group, actor);
            }
            if (!previous.getId().equals(actorId)) {
                notificationService.notifyAboutGroup(
                        previous, NotificationType.GROUP_MANAGER_CHANGED, group, manager);
            }
        }

        return AdminGroupResponse.of(group, memberRepository.countByGroupId(groupId));
    }

    @Transactional
    public void delete(UUID actorId, UUID groupId) {
        User actor = requireUser(actorId);
        UserGroup group = require(groupId);

        // Everyone who was in it, the gérant included: a list that vanishes
        // from the carnet without a word looks like a bug.
        memberRepository.findAllForGroups(List.of(groupId)).stream()
                .map(UserGroupMember::getUser)
                .filter(member -> !member.getId().equals(actorId))
                .forEach(member -> notificationService.notifyAboutFormerGroup(
                        member, NotificationType.GROUP_DELETED, group.getName(), actor));

        // A statement, and checked: with the notifications above written
        // first, delete(group) emitted no SQL and the call still answered
        // 204. See the note on deleteGroupById.
        if (groupRepository.deleteGroupById(groupId) != 1) {
            throw new ApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Ce groupe n'a pas pu être supprimé."
            );
        }
    }

    private UserGroup require(UUID groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ce groupe n'existe pas."));
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND, "Ce compte n'existe pas.", "managerId"));
    }
}
