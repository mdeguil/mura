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

/**
 * Groups as their members and gérant use them: reading one, renaming it,
 * adding and removing people, setting someone aside. Creating a group and
 * naming its gérant are an administrator's, in
 * {@link io.mura.admin.AdminGroupService}.
 */
@Service
@RequiredArgsConstructor
public class GroupService {

    private final UserGroupRepository groupRepository;
    private final UserGroupMemberRepository memberRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    /**
     * The groups a person belongs to, each with its members, in two queries
     * whatever their number.
     *
     * @param userId the reader
     * @return their groups, ordered by name
     */
    @Transactional(readOnly = true)
    public List<GroupResponse> listForUser(UUID userId) {
        List<UserGroup> groups = groupRepository.findAllForMember(userId);
        if (groups.isEmpty()) {
            return List.of();
        }

        Map<UUID, List<UserGroupMember>> byGroup = memberRepository
                .findAllForGroups(groups.stream().map(UserGroup::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(m -> m.getId().getGroupId()));

        return groups.stream()
                .map(group -> GroupResponse.from(
                        group, userId, byGroup.getOrDefault(group.getId(), List.of())))
                .toList();
    }

    /**
     * One group, for its own page. Open to everyone in it, not just the
     * gérant: a member should be able to see who else is there.
     *
     * @param userId the reader
     * @param groupId the group
     * @return the group and its members
     * @throws ApiException 404 if the group does not exist, 403 if the
     *         reader is not in it
     */
    @Transactional(readOnly = true)
    public GroupResponse get(UUID userId, UUID groupId) {
        UserGroup group = require(groupId);

        if (!memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tu ne fais pas partie de ce groupe.");
        }

        return GroupResponse.from(group, userId, membersOf(groupId));
    }

    /**
     * Renames a group.
     *
     * @param actorId the gérant
     * @param groupId the group
     * @param request the new name
     * @return the group, renamed
     * @throws ApiException 404 if the group does not exist, 403 for anyone
     *         but the gérant
     */
    @Transactional
    public GroupResponse rename(UUID actorId, UUID groupId, SaveGroupRequest request) {
        UserGroup group = requireOwner(actorId, groupId);
        group.setName(request.name().trim());
        return GroupResponse.from(group, actorId, membersOf(groupId));
    }

    /**
     * Deletes the group. Its members are told by name; the projects it
     * brought people onto keep them.
     *
     * @param actorId the gérant
     * @param groupId the group
     * @throws ApiException 404 if the group does not exist, 403 for anyone
     *         but the gérant
     */
    @Transactional
    public void delete(UUID actorId, UUID groupId) {
        UserGroup group = requireOwner(actorId, groupId);

        membersOf(groupId).stream()
                .map(UserGroupMember::getUser)
                .filter(member -> !member.getId().equals(actorId))
                .forEach(member -> notificationService.notifyAboutFormerGroup(
                        member, NotificationType.GROUP_DELETED, group.getName(), group.getOwner()));

        requireDeleted(groupId);
    }

    /**
     * Adds an account to the group outright, with no invitation to answer,
     * and tells them so: a group opens nothing on its own, so there is no
     * access to consent to.
     *
     * @param actorId the gérant
     * @param groupId the group
     * @param request the address of the person to add
     * @return the group, with them in it
     * @throws ApiException 403 for anyone but the gérant, 404 if no account
     *         uses the email, 409 if they are already in it
     */
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

        memberRepository.save(new UserGroupMember(group, person));
        notificationService.notifyAboutGroup(
                person, NotificationType.ADDED_TO_GROUP, group, group.getOwner());

        return GroupResponse.from(group, actorId, membersOf(groupId));
    }

    /**
     * Takes someone out of a group, or lets them leave it when actor and
     * member are the same person. Someone taken out is told by the group's
     * name; someone leaving tells the gérant.
     *
     * @param actorId the gérant, or the member leaving
     * @param groupId the group
     * @param memberId the member to take out
     * @throws ApiException 404 if the group does not exist or the person is
     *         not in it; 409 for the gérant, who deletes the group instead
     *         of leaving it; 403 for a member taking someone else out
     */
    @Transactional
    public void removeMember(UUID actorId, UUID groupId, UUID memberId) {
        UserGroup group = require(groupId);

        if (group.getOwner().getId().equals(memberId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Le propriétaire ne peut pas quitter son propre groupe. Supprime-le plutôt."
            );
        }

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
            notificationService.notifyAboutGroup(
                    group.getOwner(), NotificationType.MEMBER_LEFT_GROUP, group, member);
        } else {
            notificationService.notifyAboutFormerGroup(
                    member, NotificationType.REMOVED_FROM_GROUP, group.getName(), group.getOwner());
        }
    }

    /**
     * Sets a member aside without removing them, or brings them back.
     * Deliberately not called suspending: the account is untouched, and this
     * group is the only thing concerned. The member is told, unless nothing
     * changed -- two clicks in a row should not send two mails.
     *
     * @param actorId the gérant
     * @param groupId the group
     * @param memberId the member
     * @param onHold true to set them aside, false to bring them back
     * @return the group
     * @throws ApiException 404 if the group does not exist or the person is
     *         not in it, 403 for anyone but the gérant, 409 for the gérant
     *         themself
     */
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
