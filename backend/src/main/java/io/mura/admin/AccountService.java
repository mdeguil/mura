package io.mura.admin;

import io.mura.admin.dto.AccountDeletionPreview;
import io.mura.admin.dto.ChangeAccountRoleRequest;
import io.mura.common.exception.ApiException;
import io.mura.common.i18n.Texts;
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
import io.mura.task.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * The accounts, as administrators manage them -- roles, suspension,
 * deletion -- and the closing of one's own account. Nobody may remove the
 * last active administrator, whichever way they try.
 */
@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserGroupRepository userGroupRepository;
    private final TaskRepository taskRepository;
    private final NotificationService notificationService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Every account on the instance.
     *
     * @param actorId an administrator
     * @return the accounts, administrators first, then by username
     * @throws ApiException 403 unless the actor is an administrator
     */
    @Transactional(readOnly = true)
    public List<AccountResponse> list(UUID actorId) {
        requireAdmin(actorId);
        return userRepository.findAll().stream()
                .sorted(Comparator
                        .comparing((User u) -> u.getAccountRole() == AccountRole.ADMIN ? 0 : 1)
                        .thenComparing(u -> u.getUsername().toLowerCase()))
                .map(AccountResponse::from)
                .toList();
    }

    /**
     * Makes an account an administrator of the instance, or a plain user
     * again. It gives no rights inside anyone's project. An administrator
     * may step down, unless they are the last active one.
     *
     * @param actorId an administrator
     * @param targetId the account
     * @param request the new role
     * @return the account
     * @throws ApiException 403 unless the actor is an administrator, 404 if
     *         the account does not exist, 409 if it would leave no active
     *         administrator
     */
    @Transactional
    public AccountResponse changeRole(UUID actorId, UUID targetId, ChangeAccountRoleRequest request) {
        requireAdmin(actorId);
        User target = requireAccount(targetId);

        AccountRole role = request.accountRole();
        if (target.getAccountRole() == role) {
            return AccountResponse.from(target);
        }
        if (role == AccountRole.USER) {
            refuseLosingTheLastAdmin(target);
        }

        target.setAccountRole(role);
        return AccountResponse.from(target);
    }

    /**
     * Suspends or restores an account. A suspended account can no longer
     * sign in, and its next request is refused; nothing it produced is
     * removed. The owners of the projects and groups it is in are told,
     * except the actor -- unless nothing changed.
     *
     * @param actorId an administrator
     * @param targetId the account
     * @param suspended true to suspend, false to restore
     * @return the account
     * @throws ApiException 403 unless the actor is an administrator, 404 if
     *         the account does not exist, 409 when acting on oneself or
     *         suspending the last active administrator
     */
    @Transactional
    public AccountResponse setSuspended(UUID actorId, UUID targetId, boolean suspended) {
        requireAdmin(actorId);
        User target = requireAccount(targetId);
        refuseActingOnSelf(actorId, targetId, "error.account.cannotSuspendSelf");

        if (suspended == target.isSuspended()) {
            return AccountResponse.from(target);
        }
        if (suspended) {
            refuseLosingTheLastAdmin(target);
        }

        target.setSuspendedAt(suspended ? Instant.now() : null);
        tellOwners(target, actorId, suspended);
        return AccountResponse.from(target);
    }

    private void tellOwners(User target, UUID actorId, boolean suspended) {
        NotificationType type = suspended
                ? NotificationType.MEMBER_SUSPENDED
                : NotificationType.MEMBER_RESTORED;

        ownedGroupsHolding(target, actorId).forEach(group -> notificationService.notifyAboutGroup(
                group.getOwner(), type, group, target));

        projectsHolding(target, actorId).forEach(project -> notificationService.notify(
                project.getOwner(), type, project, target, null));
    }

    private List<UserGroup> ownedGroupsHolding(User target, UUID actorId) {
        return userGroupRepository.findAllForMember(target.getId()).stream()
                .filter(group -> !group.getOwner().getId().equals(target.getId()))
                .filter(group -> !group.getOwner().getId().equals(actorId))
                .toList();
    }

    private List<Project> projectsHolding(User target, UUID actorId) {
        return projectRepository.findAllForMember(target.getId()).stream()
                .filter(project -> !project.getOwner().getId().equals(target.getId()))
                .filter(project -> !project.getOwner().getId().equals(actorId))
                .toList();
    }

    /**
     * Refuses anyone but an administrator. Public so the other
     * administration endpoints can lean on the one definition of who counts
     * as an administrator.
     *
     * @param actorId the caller
     * @throws ApiException 403 unless the caller is an administrator, 404 if
     *         their account no longer exists
     */
    public void requireAdmin(UUID actorId) {
        if (!requireAccount(actorId).getAccountRole().administers()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "error.admin.only");
        }
    }

    private User requireAccount(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "error.account.notFound"));
    }

    private void refuseActingOnSelf(UUID actorId, UUID targetId, String message) {
        if (actorId.equals(targetId)) {
            throw new ApiException(HttpStatus.CONFLICT, message);
        }
    }

    private void refuseLosingTheLastAdmin(User target) {
        if (target.getAccountRole() != AccountRole.ADMIN) {
            return;
        }
        long remaining = userRepository.countByAccountRoleAndSuspendedAtIsNullAndIdNot(
                AccountRole.ADMIN, target.getId());
        if (remaining == 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "error.account.lastAdmin"
            );
        }
    }

    /**
     * What deleting an account would do, for an administrator about to.
     *
     * @param actorId an administrator
     * @param targetId the account
     * @return the projects handed over or deleted, the groups deleted and the
     *         tasks left without assignee
     * @throws ApiException 403 unless the actor is an administrator, 404 if
     *         the account does not exist
     */
    @Transactional(readOnly = true)
    public AccountDeletionPreview deletionPreview(UUID actorId, UUID targetId) {
        requireAdmin(actorId);
        return previewFor(requireAccount(targetId));
    }

    /**
     * The same preview for someone closing their own account: they are owed
     * the same account of what goes and what stays as an administrator gets.
     *
     * @param userId the account
     * @return the consequences of deleting it
     * @throws ApiException 404 if the account no longer exists
     */
    @Transactional(readOnly = true)
    public AccountDeletionPreview ownDeletionPreview(UUID userId) {
        return previewFor(requireAccount(userId));
    }

    private AccountDeletionPreview previewFor(User target) {
        UUID targetId = target.getId();
        List<AccountDeletionPreview.ProjectHandover> transferred = new ArrayList<>();
        List<String> removed = new ArrayList<>();

        for (Project project : projectRepository.findAllByOwnerId(targetId)) {
            successorFor(project, targetId)
                    .ifPresentOrElse(
                            successor -> transferred.add(new AccountDeletionPreview.ProjectHandover(
                                    project.getName(), successor.getUser().getUsername())),
                            () -> removed.add(project.getName())
                    );
        }

        return new AccountDeletionPreview(
                target.getUsername(),
                transferred,
                removed,
                userGroupRepository.findAllByOwnerId(targetId).stream()
                        .map(UserGroup::getName)
                        .toList(),
                taskRepository.countByAssigneeId(targetId)
        );
    }

    /**
     * Deletes a suspended account for good. Each project it owns passes to
     * another member when there is one, and goes with the account otherwise;
     * its tasks lose their assignee. See {@link #deletionPreview} for what
     * that means for a given account before doing it.
     *
     * @param actorId an administrator
     * @param targetId the account
     * @throws ApiException 403 unless the actor is an administrator, 404 if
     *         the account does not exist, 409 when acting on oneself or if
     *         the account was not suspended first
     */
    @Transactional
    public void delete(UUID actorId, UUID targetId) {
        requireAdmin(actorId);
        User target = requireAccount(targetId);
        refuseActingOnSelf(actorId, targetId, "error.account.cannotDeleteSelf");

        if (!target.isSuspended()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "error.account.suspendFirst"
            );
        }

        erase(target, actorId);
    }

    /**
     * Someone closing their own account: the right to erasure (RGPD,
     * art. 17) without having to ask anybody. There is no suspension step
     * here -- that step exists so an administrator cannot remove someone
     * else in one click. Here the person asks for it themself, and typing
     * their password is the deliberate step instead.
     *
     * @param userId the account
     * @param password its current password
     * @throws ApiException 404 if the account no longer exists; 403 for a
     *         wrong password, naming the field; 409 for the last active
     *         administrator
     */
    @Transactional
    public void deleteOwn(UUID userId, String password) {
        User target = requireAccount(userId);

        if (!passwordEncoder.matches(password, target.getPassword())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "error.account.wrongPassword", "password");
        }
        refuseLosingTheLastAdmin(target);

        erase(target, userId);
    }

    private void erase(User target, UUID actorId) {
        UUID targetId = target.getId();

        List<Project> theyBelongTo = projectsHolding(target, actorId);
        List<UserGroup> groupsHoldingThem = ownedGroupsHolding(target, actorId);

        for (Project project : projectRepository.findAllByOwnerId(targetId)) {
            successorFor(project, targetId).ifPresent(successor -> {
                successor.setRole(ProjectRole.OWNER);
                project.setOwner(successor.getUser());
                notificationService.notify(
                        successor.getUser(),
                        NotificationType.MEMBER_DELETED,
                        project,
                        target,
                        Texts.get(successor.getUser().getLocale(), "notification.ownershipTransferred")
                );
            });
        }

        theyBelongTo.forEach(project -> notificationService.notify(
                project.getOwner(), NotificationType.MEMBER_DELETED, project, target, null));
        groupsHoldingThem.forEach(group -> notificationService.notifyAboutGroup(
                group.getOwner(), NotificationType.MEMBER_DELETED, group, target));

        userRepository.deleteAccountById(targetId);
    }
    private Optional<ProjectMember> successorFor(Project project, UUID leavingUserId) {
        return projectMemberRepository.findAllForProject(project.getId()).stream()
                .filter(m -> !m.getUser().getId().equals(leavingUserId))
                .min(Comparator
                        .comparing((ProjectMember m) -> m.getRole().manages() ? 0 : 1)
                        .thenComparing(ProjectMember::getJoinedAt))
    ;
    }
}
