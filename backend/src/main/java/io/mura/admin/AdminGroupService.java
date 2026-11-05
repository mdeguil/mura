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
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Groups as an administrator manages them. An administrator sets a group up
 * and says who runs it. They may see who is in it, but changing that stays
 * the gérant's business: two people editing the same list is how a list
 * stops meaning anything. The callers check that the actor is an
 * administrator.
 */
@Service
@RequiredArgsConstructor
public class AdminGroupService {

    private final UserGroupRepository groupRepository;
    private final UserGroupMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * Every group with its gérant and members, in two queries whatever their
     * number.
     *
     * @return the groups, by name
     */
    @Transactional(readOnly = true)
    public List<AdminGroupResponse> list() {
        List<UserGroup> groups = groupRepository.findAllWithOwner();
        if (groups.isEmpty()) {
            return List.of();
        }

        Map<UUID, List<UserGroupMember>> byGroup = memberRepository
                .findAllForGroups(groups.stream().map(UserGroup::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(m -> m.getId().getGroupId()));

        return groups.stream()
                .sorted(Comparator.comparing(g -> g.getName().toLowerCase()))
                .map(group -> AdminGroupResponse.of(
                        group, byGroup.getOrDefault(group.getId(), List.of())))
                .toList();
    }

    /**
     * Creates a group, with its gérant as its first member. The gérant is
     * told, naming the administrator, unless they made it themself.
     *
     * @param actorId the administrator
     * @param request the name and the gérant
     * @return the group
     * @throws ApiException 404 if the actor's or the gérant's account does
     *         not exist
     */
    @Transactional
    public AdminGroupResponse create(UUID actorId, SaveAdminGroupRequest request) {
        User actor = requireUser(actorId);
        User manager = requireUser(request.managerId());

        UserGroup group = new UserGroup();
        group.setName(request.name());
        group.setOwner(manager);
        groupRepository.save(group);

        UserGroupMember founder = memberRepository.save(new UserGroupMember(group, manager));

        if (!manager.getId().equals(actorId)) {
            notificationService.notifyAboutGroup(
                    manager, NotificationType.GROUP_ENTRUSTED, group, actor);
        }

        return AdminGroupResponse.of(group, List.of(founder));
    }

    /**
     * Renames a group, or hands it to another gérant. The new gérant joins
     * the group if they were not in it, and the previous one stays a member.
     * Both sides of a handover are told, unless they are the administrator.
     *
     * @param actorId the administrator
     * @param groupId the group
     * @param request the name and the gérant
     * @return the group
     * @throws ApiException 404 if the group or one of the accounts does not
     *         exist
     */
    @Transactional
    public AdminGroupResponse update(UUID actorId, UUID groupId, SaveAdminGroupRequest request) {
        User actor = requireUser(actorId);
        UserGroup group = require(groupId);
        User manager = requireUser(request.managerId());
        User previous = group.getOwner();

        group.setName(request.name());

        if (!previous.getId().equals(manager.getId())) {
            group.setOwner(manager);
            if (!memberRepository.existsByGroupIdAndUserId(groupId, manager.getId())) {
                memberRepository.save(new UserGroupMember(group, manager));
            }

            if (!manager.getId().equals(actorId)) {
                notificationService.notifyAboutGroup(
                        manager, NotificationType.GROUP_ENTRUSTED, group, actor);
            }
            if (!previous.getId().equals(actorId)) {
                notificationService.notifyAboutGroup(
                        previous, NotificationType.GROUP_MANAGER_CHANGED, group, manager);
            }
        }

        return AdminGroupResponse.of(group, memberRepository.findAllForGroups(List.of(groupId)));
    }

    /**
     * Deletes a group. Everyone who was in it, the gérant included, is told
     * by the group's name -- except the administrator, if they were in it;
     * their accounts and projects are untouched.
     *
     * @param actorId the administrator
     * @param groupId the group
     * @throws ApiException 404 if the group or the actor's account does not
     *         exist
     */
    @Transactional
    public void delete(UUID actorId, UUID groupId) {
        User actor = requireUser(actorId);
        UserGroup group = require(groupId);

        memberRepository.findAllForGroups(List.of(groupId)).stream()
                .map(UserGroupMember::getUser)
                .filter(member -> !member.getId().equals(actorId))
                .forEach(member -> notificationService.notifyAboutFormerGroup(
                        member, NotificationType.GROUP_DELETED, group.getName(), actor));

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
