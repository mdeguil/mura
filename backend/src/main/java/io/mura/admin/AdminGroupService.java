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

    @Transactional(readOnly = true)
    public List<AdminGroupResponse> list() {
        return groupRepository.findAll().stream()
                .sorted(Comparator.comparing(g -> g.getName().toLowerCase()))
                .map(group -> AdminGroupResponse.of(
                        group, memberRepository.countByGroupId(group.getId())))
                .toList();
    }

    @Transactional
    public AdminGroupResponse create(SaveAdminGroupRequest request) {
        User manager = requireUser(request.managerId());

        UserGroup group = new UserGroup();
        group.setName(request.name());
        group.setOwner(manager);
        groupRepository.save(group);

        // The gérant is in their own group: one they are not part of would
        // not appear in their carnet, which is where they manage it from.
        memberRepository.save(new UserGroupMember(group, manager));

        return AdminGroupResponse.of(group, 1L);
    }

    @Transactional
    public AdminGroupResponse update(UUID groupId, SaveAdminGroupRequest request) {
        UserGroup group = require(groupId);
        User manager = requireUser(request.managerId());

        group.setName(request.name());

        if (!group.getOwner().getId().equals(manager.getId())) {
            group.setOwner(manager);
            // Handing a group over puts the new gérant in it, for the same
            // reason creating one does. The previous one stays a member:
            // losing the group entirely is not what changing its gérant
            // was meant to do.
            if (!memberRepository.existsByGroupIdAndUserId(groupId, manager.getId())) {
                memberRepository.save(new UserGroupMember(group, manager));
            }
        }

        return AdminGroupResponse.of(group, memberRepository.countByGroupId(groupId));
    }

    @Transactional
    public void delete(UUID groupId) {
        groupRepository.delete(require(groupId));
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
