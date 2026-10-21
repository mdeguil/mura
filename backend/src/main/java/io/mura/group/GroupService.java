package io.mura.group;

import io.mura.common.exception.ApiException;
import io.mura.group.dto.AddGroupMemberRequest;
import io.mura.group.dto.GroupResponse;
import io.mura.group.dto.SaveGroupRequest;
import io.mura.member.User;
import io.mura.member.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public GroupResponse create(UUID ownerId, SaveGroupRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable."));

        UserGroup group = new UserGroup();
        group.setName(request.name().trim());
        group.setOwner(owner);
        groupRepository.save(group);

        // Whoever creates a group is in it: a group you are not part of would
        // not show up in your own carnet.
        UserGroupMember membership = memberRepository.save(new UserGroupMember(group, owner));

        return GroupResponse.from(group, ownerId, List.of(membership));
    }

    @Transactional
    public GroupResponse rename(UUID actorId, UUID groupId, SaveGroupRequest request) {
        UserGroup group = requireOwner(actorId, groupId);
        group.setName(request.name().trim());
        return GroupResponse.from(group, actorId, membersOf(groupId));
    }

    @Transactional
    public void delete(UUID actorId, UUID groupId) {
        groupRepository.delete(requireOwner(actorId, groupId));
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
        // own, so there is no access to consent to.
        memberRepository.save(new UserGroupMember(group, person));

        return GroupResponse.from(group, actorId, membersOf(groupId));
    }

    @Transactional
    public void removeMember(UUID actorId, UUID groupId, UUID memberId) {
        UserGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Groupe introuvable."));

        if (group.getOwner().getId().equals(memberId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Le propriétaire ne peut pas quitter son propre groupe. Supprime-le plutôt."
            );
        }

        // The owner manages the group; anyone else may still show themselves
        // out, which is the only case where actor and target are the same.
        if (!actorId.equals(memberId)) {
            requireOwner(actorId, groupId);
        }

        UserGroupMember membership = memberRepository.findByGroupIdAndUserId(groupId, memberId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cette personne ne fait pas partie du groupe."
                ));

        memberRepository.delete(membership);
    }

    private List<UserGroupMember> membersOf(UUID groupId) {
        return memberRepository.findAllForGroups(List.of(groupId));
    }

    private UserGroup requireOwner(UUID userId, UUID groupId) {
        UserGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Groupe introuvable."));

        if (!group.getOwner().getId().equals(userId)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Seul le propriétaire du groupe peut le modifier."
            );
        }

        return group;
    }
}
