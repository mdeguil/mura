package io.mura.admin;

import io.mura.admin.dto.AccountDeletionPreview;
import io.mura.admin.dto.ChangeAccountRoleRequest;
import io.mura.common.exception.ApiException;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserGroupRepository userGroupRepository;
    private final TaskRepository taskRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<AccountResponse> list(UUID actorId) {
        requireAdmin(actorId);
        return userRepository.findAll().stream()
                // Administrators first, then alphabetically: the short list
                // of people who can change things is the one worth seeing.
                .sorted(Comparator
                        .comparing((User u) -> u.getAccountRole() == AccountRole.ADMIN ? 0 : 1)
                        .thenComparing(u -> u.getUsername().toLowerCase()))
                .map(AccountResponse::from)
                .toList();
    }

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

    @Transactional
    public AccountResponse setSuspended(UUID actorId, UUID targetId, boolean suspended) {
        requireAdmin(actorId);
        User target = requireAccount(targetId);
        refuseActingOnSelf(actorId, targetId, "Tu ne peux pas suspendre ton propre compte.");

        // Nothing to do, and nothing to announce: re-sending the same state
        // must not put a second line in anyone's bell.
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

    // The people who have to work around an absence are the ones who put
    // this person on a project or in a group, so they are the ones told --
    // not the whole application, and not the administrator who just acted.
    private void tellOwners(User target, UUID actorId, boolean suspended) {
        NotificationType type = suspended
                ? NotificationType.MEMBER_SUSPENDED
                : NotificationType.MEMBER_RESTORED;

        ownedGroupsHolding(target, actorId).forEach(group -> notificationService.notifyAboutGroup(
                group.getOwner(), type, group, target));

        projectsHolding(target, actorId).forEach(project -> notificationService.notify(
                project.getOwner(), type, project, target, null));
    }

    // Groups this person belongs to that somebody else owns, leaving out the
    // administrator doing the work: they already know.
    private List<UserGroup> ownedGroupsHolding(User target, UUID actorId) {
        return userGroupRepository.findAllForMember(target.getId()).stream()
                .filter(group -> !group.getOwner().getId().equals(target.getId()))
                .filter(group -> !group.getOwner().getId().equals(actorId))
                .toList();
    }

    // Same, for projects. Owning one is not being a member of someone
    // else's, so a project of their own tells nobody.
    private List<Project> projectsHolding(User target, UUID actorId) {
        return projectRepository.findAllForMember(target.getId()).stream()
                .filter(project -> !project.getOwner().getId().equals(target.getId()))
                .filter(project -> !project.getOwner().getId().equals(actorId))
                .toList();
    }

    // Public so the other administration endpoints can lean on the one
    // definition of who counts as an administrator.
    public void requireAdmin(UUID actorId) {
        if (!requireAccount(actorId).getAccountRole().administers()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Cette page est réservée aux administrateurs.");
        }
    }

    private User requireAccount(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ce compte n'existe pas."));
    }

    // Only suspension. Stepping down from the role is a normal thing to
    // want -- it is how you hand over -- and the last-administrator guard
    // already stops it from emptying the room. Suspending yourself has no
    // such legitimate use: it locks you out on the spot, and only someone
    // else can undo it.
    private void refuseActingOnSelf(UUID actorId, UUID targetId, String message) {
        if (actorId.equals(targetId)) {
            throw new ApiException(HttpStatus.CONFLICT, message);
        }
    }

    // Nobody may remove the last way back in. Suspending an administrator
    // counts as removing one: a suspended account cannot sign in.
    private void refuseLosingTheLastAdmin(User target) {
        if (target.getAccountRole() != AccountRole.ADMIN) {
            return;
        }
        long remaining = userRepository.findAll().stream()
                .filter(u -> u.getAccountRole() == AccountRole.ADMIN)
                .filter(u -> !u.isSuspended())
                .filter(u -> !u.getId().equals(target.getId()))
                .count();
        if (remaining == 0) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "C'est le dernier administrateur actif. Nomme quelqu'un d'autre avant."
            );
        }
    }

    @Transactional(readOnly = true)
    public AccountDeletionPreview deletionPreview(UUID actorId, UUID targetId) {
        requireAdmin(actorId);
        User target = requireAccount(targetId);

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

    @Transactional
    public void delete(UUID actorId, UUID targetId) {
        requireAdmin(actorId);
        User target = requireAccount(targetId);
        refuseActingOnSelf(actorId, targetId, "Tu ne peux pas supprimer ton propre compte.");

        // Suspended first, the way a project is archived before it can be
        // deleted. It puts a deliberate step in front of something that
        // cannot be undone -- and it means the last active administrator is
        // already protected, since suspending them is refused.
        if (!target.isSuspended()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Suspends d'abord ce compte. La suppression est définitive."
            );
        }

        // Everyone who has to hear about it, gathered before anything is
        // removed: the memberships that say who works with this person go
        // with the account.
        List<Project> theyBelongTo = projectsHolding(target, actorId);
        List<UserGroup> groupsHoldingThem = ownedGroupsHolding(target, actorId);

        // A project outlives the account whenever somebody else is in it.
        // Handing it over is the whole point: letting it go with its owner
        // would take other people's tasks down too.
        for (Project project : projectRepository.findAllByOwnerId(targetId)) {
            successorFor(project, targetId).ifPresent(successor -> {
                successor.setRole(ProjectRole.OWNER);
                project.setOwner(successor.getUser());
                // Nobody should become the owner of a project without being
                // told, least of all by finding out later.
                notificationService.notify(
                        successor.getUser(),
                        NotificationType.MEMBER_DELETED,
                        project,
                        target,
                        "Tu es maintenant propriétaire de ce projet."
                );
            });
        }

        theyBelongTo.forEach(project -> notificationService.notify(
                project.getOwner(), NotificationType.MEMBER_DELETED, project, target, null));
        groupsHoldingThem.forEach(group -> notificationService.notifyAboutGroup(
                group.getOwner(), NotificationType.MEMBER_DELETED, group, target));

        // Whatever is still owned by this account is, by definition, a
        // project nobody else belongs to, and the foreign key takes those
        // with it -- along with the memberships, invitations, notifications,
        // carnet entries and groups, which is what ON DELETE CASCADE was
        // written for. Assigned tasks survive: that column is SET NULL.
        //
        // Deliberately a statement rather than userRepository.delete(target):
        // after the handovers above, the entity-level delete produced no SQL
        // at all in this transaction while the handovers themselves still
        // committed. flushAutomatically writes the handovers first, so a
        // project that has just changed hands is never caught by the
        // cascade, and clearAutomatically drops the now-stale entities.
        userRepository.deleteAccountById(targetId);
    }
    // Who inherits a project when its owner leaves: someone who already
    // manages it if there is one, otherwise the member who has been there
    // longest. Deterministic, so the preview and the deletion cannot
    // disagree about what is going to happen.
    private Optional<ProjectMember> successorFor(Project project, UUID leavingUserId) {
        return projectMemberRepository.findAllForProject(project.getId()).stream()
                .filter(m -> !m.getUser().getId().equals(leavingUserId))
                .min(Comparator
                        .comparing((ProjectMember m) -> m.getRole().manages() ? 0 : 1)
                        .thenComparing(ProjectMember::getJoinedAt))
    ;
    }
}
