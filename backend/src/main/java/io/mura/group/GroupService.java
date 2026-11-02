package io.mura.group;

import io.mura.common.exception.ApiException;
import io.mura.group.dto.AddGroupMemberRequest;
import io.mura.group.dto.GroupResponse;
import io.mura.group.dto.SaveGroupRequest;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.notification.NotificationService;
import io.mura.notification.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final UserGroupRepository groupRepository;
    private final UserGroupMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<GroupResponse> listForUser(UUID userId) {
        List<UserGroup> groups = groupRepository.findAllForMember(userId);
        if (groups.isEmpty()) {
            return List.of();
        }

        Map<UUID, List<UserGroupMember>> byGroup = memberRepository
                .findAllForGroups(groups.stream().map(UserGroup::getId).toList())
                .stream()
                // Read through the embedded id rather than getGroup(): the
                // association is a lazy proxy, and this keeps it uninitialised.
                .collect(Collectors.groupingBy(m -> m.getId().getGroupId()));

        return groups.stream()
                .map(group -> GroupResponse.from(
                        group, userId, byGroup.getOrDefault(group.getId(), List.of())))
                .toList();
    }

    // One group on its own page. Open to everyone in it, not just the
    // gérant: a member should be able to see who else is there.
    @Transactional(readOnly = true)
    public GroupResponse get(UUID userId, UUID groupId) {
        UserGroup group = require(groupId);

        if (!memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tu ne fais pas partie de ce groupe.");
        }

        return GroupResponse.from(group, userId, membersOf(groupId));
    }

    @Transactional
    public GroupResponse rename(UUID actorId, UUID groupId, SaveGroupRequest request) {
        UserGroup group = requireOwner(actorId, groupId);
        group.setName(request.name().trim());
        return GroupResponse.from(group, actorId, membersOf(groupId));
    }

    @Transactional
    public void delete(UUID actorId, UUID groupId) {
        UserGroup group = requireOwner(actorId, groupId);

        // Told before the row goes, and told with the name rather than the
        // group itself: there is nothing left to open by the time they read it.
        membersOf(groupId).stream()
                .map(UserGroupMember::getUser)
                .filter(member -> !member.getId().equals(actorId))
                .forEach(member -> notificationService.notifyAboutFormerGroup(
                        member, NotificationType.GROUP_DELETED, group.getName(), group.getOwner()));

        requireDeleted(groupId);
    }

    @Transactional
    public GroupResponse addMember(UUID actorId, UUID groupId, AddGroupMemberRequest request) {
        UserGroup group = requireOwner(actorId, groupId);

        String email = request.email().trim();
        User person = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Aucun compte Mura n'utilise l'email " + email + "."
                ));

        if (memberRepository.existsByGroupIdAndUserId(groupId, person.getId())) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    person.getUsername() + " fait déjà partie de ce groupe."
            );
        }

        // Added outright rather than invited: a group opens nothing on its
        // own, so there is no access to consent to. Being told is the least
        // that is owed in exchange.
        memberRepository.save(new UserGroupMember(group, person));
        notificationService.notifyAboutGroup(
                person, NotificationType.ADDED_TO_GROUP, group, group.getOwner());

        return GroupResponse.from(group, actorId, membersOf(groupId));
    }

    @Transactional
    public void removeMember(UUID actorId, UUID groupId, UUID memberId) {
        UserGroup group = require(groupId);

        if (group.getOwner().getId().equals(memberId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Le propriétaire ne peut pas quitter son propre groupe. Supprime-le plutôt."
            );
        }

        // The owner manages the group; anyone else may still show themselves
        // out, which is the only case where actor and target are the same.
        boolean leaving = actorId.equals(memberId);
        if (!leaving) {
            requireOwner(actorId, groupId);
        }

        UserGroupMember membership = memberRepository.findByGroupIdAndUserId(groupId, memberId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cette personne ne fait pas partie du groupe."
                ));

        User member = membership.getUser();
        memberRepository.delete(membership);

        if (leaving) {
            // The gérant still has the group, so the line can lead back to it.
            notificationService.notifyAboutGroup(
                    group.getOwner(), NotificationType.MEMBER_LEFT_GROUP, group, member);
        } else {
            notificationService.notifyAboutFormerGroup(
                    member, NotificationType.REMOVED_FROM_GROUP, group.getName(), group.getOwner());
        }
    }

    // Set aside without being removed, and brought back. Deliberately not
    // called suspending: the account is untouched, and this group is the
    // only thing concerned.
    @Transactional
    public GroupResponse setMemberHold(UUID actorId, UUID groupId, UUID memberId, boolean onHold) {
        UserGroup group = requireOwner(actorId, groupId);

        if (group.getOwner().getId().equals(memberId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Le gérant ne peut pas se mettre en retrait de son propre groupe."
            );
        }

        UserGroupMember membership = memberRepository.findByGroupIdAndUserId(groupId, memberId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cette personne ne fait pas partie du groupe."
                ));

        // Already where it was asked to be: nothing changed, so nobody is
        // told. Two clicks in a row should not send two mails.
        if (membership.isOnHold() != onHold) {
            membership.setOnHoldAt(onHold ? Instant.now() : null);
            notificationService.notifyAboutGroup(
                    membership.getUser(),
                    onHold ? NotificationType.HELD_IN_GROUP : NotificationType.RESTORED_IN_GROUP,
                    group,
                    group.getOwner()
            );
        }

        return GroupResponse.from(group, actorId, membersOf(groupId));
    }

    // Nobody should be told a group is gone and then find it still there,
    // which is exactly what delete(entity) did once notifications had been
    // written first. See the statement in UserGroupRepository.
    private void requireDeleted(UUID groupId) {
        if (groupRepository.deleteGroupById(groupId) != 1) {
            throw new ApiException(
                    HttpStatus.INTERNAL_SERVER_ERROR,
                    "Ce groupe n'a pas pu être supprimé."
            );
        }
    }

    private List<UserGroupMember> membersOf(UUID groupId) {
        return memberRepository.findAllForGroups(List.of(groupId));
    }

    private UserGroup require(UUID groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Groupe introuvable."));
    }

    private UserGroup requireOwner(UUID userId, UUID groupId) {
        UserGroup group = require(groupId);

        if (!group.getOwner().getId().equals(userId)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Seul le propriétaire du groupe peut le modifier."
            );
        }

        return group;
    }
}
