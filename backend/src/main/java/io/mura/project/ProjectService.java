package io.mura.project;

import io.mura.common.exception.ApiException;
import io.mura.group.UserGroupMember;
import io.mura.group.UserGroupMemberRepository;
import io.mura.group.UserGroupRepository;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.notification.NotificationService;
import io.mura.notification.NotificationType;
import io.mura.project.dto.CreateProjectRequest;
import io.mura.project.dto.MemberResponse;
import io.mura.project.dto.ProjectResponse;
import io.mura.project.dto.UpdateProjectRequest;
import io.mura.task.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Projects and their teams: creating and editing them, the bin, roles,
 * handing a project over, bringing a group on, and people leaving. Who may
 * do what is checked through {@link ProjectAccessGuard}.
 */
@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final String DEFAULT_COLOR = "#14b8a6";

    private final ProjectRepository projectRepository;
    private final ProjectAccessGuard access;
    private final ProjectTypeService projectTypeService;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final TaskService taskService;
    private final InvitationService invitationService;
    private final NotificationService notificationService;
    private final UserGroupRepository groupRepository;
    private final UserGroupMemberRepository groupMemberRepository;

    /**
     * The projects a person is on, each with its team, in two queries
     * whatever their number. Archived projects are left out.
     *
     * @param userId the reader
     * @return their active projects, newest first
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> listForUser(UUID userId) {
        List<Project> projects = projectRepository.findAllForMember(userId);
        if (projects.isEmpty()) {
            return List.of();
        }

        Map<UUID, List<ProjectMember>> membersByProject = projectMemberRepository
                .findAllForProjects(projects.stream().map(Project::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(member -> member.getId().getProjectId()));

        return projects.stream()
                .map(project -> ProjectResponse.from(
                        project,
                        ProjectAccess.MEMBER,
                        membersByProject.getOrDefault(project.getId(), List.of())
                ))
                .toList();
    }

    /**
     * One project, as the reader may see it. A member sees it whole. Someone
     * holding a live invitation may read what they are being invited to
     * before deciding -- the facts, the description and who is already on
     * the team -- but not the team's addresses.
     *
     * @param userId the reader
     * @param projectId the project
     * @return the project, with {@link ProjectAccess} saying which of the two
     *         the reader is
     * @throws ApiException 404 if the project does not exist, 403 for anyone
     *         neither on the team nor invited
     */
    @Transactional(readOnly = true)
    public ProjectResponse getForUser(UUID userId, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable."));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            return ProjectResponse.from(
                    project,
                    ProjectAccess.MEMBER,
                    projectMemberRepository.findAllForProject(projectId)
            );
        }

        if (invitationRepository.existsByProjectIdAndInvitedUserIdAndStatus(
                projectId, userId, InvitationStatus.PENDING)) {
            return ProjectResponse.from(
                    project,
                    ProjectAccess.INVITED,
                    projectMemberRepository.findAllForProject(projectId)
            );
        }

        throw new ApiException(HttpStatus.FORBIDDEN, "Tu n'as pas accès à ce projet.");
    }

    /**
     * A project's team.
     *
     * @param userId the reader, who must be on it
     * @param projectId the project
     * @return the members, owner first, then admins, then members
     * @throws ApiException 404 if the project does not exist, 403 if the
     *         reader is not on it
     */
    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers(UUID userId, UUID projectId) {
        access.requireMembership(userId, projectId);
        return projectMemberRepository.findAllForProject(projectId).stream()
                .map(MemberResponse::from)
                .toList();
    }

    /**
     * The owner's bin: the archived projects they own. Only the owner sees
     * it, since only they can restore or delete.
     *
     * @param ownerId the reader
     * @return their archived projects, without their teams, most recently
     *         changed first
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> listArchivedForUser(UUID ownerId) {
        return projectRepository.findAllByOwnerIdAndArchivedTrueOrderByUpdatedAtDesc(ownerId).stream()
                .map(project -> ProjectResponse.from(project, ProjectAccess.MEMBER, List.of()))
                .toList();
    }

    /**
     * Edits a project, replacing every field. Editing the details is part of
     * running the project, so admins may do it too; putting it in the bin
     * is not, and stays with the owner. Reaching ACHEVE stamps the
     * completion date, and leaving it clears the stamp.
     *
     * @param actorId the owner or an admin
     * @param projectId the project
     * @param request the project's new details; an empty colour falls back
     *        to the default
     * @return the project, with its team
     * @throws ApiException 404 if the project or the type does not exist,
     *         403 for a plain member or anyone off the team
     */
    @Transactional
    public ProjectResponse update(UUID actorId, UUID projectId, UpdateProjectRequest request) {
        Project project = access.requireManager(actorId, projectId).getProject();

        project.setName(request.name());
        project.setDescription(request.description());
        project.setColor(StringUtils.hasText(request.color()) ? request.color() : DEFAULT_COLOR);
        project.setType(projectTypeService.require(request.typeId()));
        project.setStartDate(request.startDate());
        applyStatus(project, request.status());

        return ProjectResponse.from(
                project,
                ProjectAccess.MEMBER,
                projectMemberRepository.findAllForProject(projectId)
        );
    }

    /**
     * Puts a project in the bin: it leaves everyone's project list, and
     * nothing is lost.
     *
     * @param actorId the owner
     * @param projectId the project
     * @return the project, archived, without its team
     * @throws ApiException 404 if the project does not exist, 403 for anyone
     *         but the owner
     */
    @Transactional
    public ProjectResponse archive(UUID actorId, UUID projectId) {
        Project project = access.requireOwner(actorId, projectId);
        project.setArchived(true);
        return ProjectResponse.from(project, ProjectAccess.MEMBER, List.of());
    }

    /**
     * Takes a project out of the bin, back into everyone's list.
     *
     * @param actorId the owner
     * @param projectId the project
     * @return the project, with its team
     * @throws ApiException 404 if the project does not exist, 403 for anyone
     *         but the owner
     */
    @Transactional
    public ProjectResponse restore(UUID actorId, UUID projectId) {
        Project project = access.requireOwner(actorId, projectId);
        project.setArchived(false);
        return ProjectResponse.from(
                project,
                ProjectAccess.MEMBER,
                projectMemberRepository.findAllForProject(projectId)
        );
    }

    /**
     * Deletes a project for good. Everything hanging off it goes with it --
     * tasks, subtasks, status history, members, invitations -- which is why
     * it has to sit in the bin first.
     *
     * @param actorId the owner
     * @param projectId the project
     * @throws ApiException 404 if the project does not exist, 403 for anyone
     *         but the owner, 409 unless it was archived first
     */
    @Transactional
    public void delete(UUID actorId, UUID projectId) {
        Project project = access.requireOwner(actorId, projectId);

        if (!project.isArchived()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Le projet doit être archivé avant d'être supprimé."
            );
        }

        projectRepository.delete(project);
    }

    /**
     * Creates the project with its creator as owner. The listed addresses
     * are invited and must answer; a group's people join at once and are
     * told so. Someone both in the group and listed simply joins.
     *
     * @param ownerId the creator, who becomes its owner
     * @param request the project, and who to invite or bring on
     * @return the project, with its team
     * @throws ApiException 404 for an unknown address or group, 403 if the
     *         creator is not in the group, 409 if they list their own
     *         address; nothing is created then
     */
    @Transactional
    public ProjectResponse create(UUID ownerId, CreateProjectRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable."));

        Project project = new Project();
        project.setName(request.name());
        project.setDescription(request.description());
        project.setColor(StringUtils.hasText(request.color()) ? request.color() : DEFAULT_COLOR);
        project.setType(projectTypeService.require(request.typeId()));
        project.setStartDate(request.startDate());
        project.setStatus(ProjectStatus.A_VENIR);
        project.setOwner(owner);
        projectRepository.save(project);

        projectMemberRepository.save(new ProjectMember(project, owner, ProjectRole.OWNER));

        List<User> fromGroup = request.groupId() == null
                ? List.of()
                : joinersFromGroup(ownerId, project.getId(), request.groupId());

        Set<String> joiningEmails = fromGroup.stream()
                .map(user -> user.getEmail().toLowerCase())
                .collect(Collectors.toSet());
        List<String> toInvite = request.invitedEmails() == null
                ? List.of()
                : request.invitedEmails().stream()
                        .filter(email -> !joiningEmails.contains(email.trim().toLowerCase()))
                        .toList();
        invitationService.inviteAll(project, owner, toInvite);

        bringOn(project, owner, fromGroup);

        return ProjectResponse.from(
                project, ProjectAccess.MEMBER, projectMemberRepository.findAllForProject(project.getId()));
    }

    /**
     * Makes a member an admin, or a plain member again.
     *
     * @param actorId the owner
     * @param projectId the project
     * @param memberId the member
     * @param role ADMIN or MEMBER
     * @return the member, with the new role
     * @throws ApiException 404 if the project does not exist or the person
     *         is not on it, 403 for anyone but the owner; 409 for OWNER,
     *         which only a transfer gives, or for the owner's own role
     */
    @Transactional
    public MemberResponse changeRole(UUID actorId, UUID projectId, UUID memberId, ProjectRole role) {
        Project project = access.requireOwner(actorId, projectId);

        if (role == ProjectRole.OWNER) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Pour céder le projet, utilise le transfert de propriété."
            );
        }

        if (project.getOwner().getId().equals(memberId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Le propriétaire garde son rôle tant qu'il n'a pas cédé le projet."
            );
        }

        ProjectMember membership = requireMemberOf(projectId, memberId);
        membership.setRole(role);
        return MemberResponse.from(membership);
    }

    /**
     * Hands the project over, in one step: there is never a moment with two
     * owners or none. The previous owner stays on as an admin rather than
     * being dropped from a project they built.
     *
     * @param actorId the current owner
     * @param projectId the project
     * @param newOwnerId the member who takes it
     * @return the team, roles updated
     * @throws ApiException 404 if the project does not exist or the
     *         successor is not on it, 403 for anyone but the owner, 409 when
     *         handing it to oneself
     */
    @Transactional
    public List<MemberResponse> transferOwnership(UUID actorId, UUID projectId, UUID newOwnerId) {
        Project project = access.requireOwner(actorId, projectId);

        if (actorId.equals(newOwnerId)) {
            throw new ApiException(HttpStatus.CONFLICT, "Tu es déjà le propriétaire de ce projet.");
        }

        ProjectMember successor = requireMemberOf(projectId, newOwnerId);
        ProjectMember previous = requireMemberOf(projectId, actorId);

        successor.setRole(ProjectRole.OWNER);
        previous.setRole(ProjectRole.ADMIN);
        project.setOwner(successor.getUser());

        return projectMemberRepository.findAllForProject(projectId).stream()
                .map(MemberResponse::from)
                .toList();
    }

    /**
     * Brings people over from a group, straight onto the team: no invitation
     * to answer. This is the one way into a project that skips asking, so it
     * is held to what inviting already requires -- a manager of the project,
     * who is also in the group -- and everyone added is told at once, bell
     * and mail, and can show themselves out as usual. Whatever invitation
     * they still had for the project goes.
     *
     * <p>The group comes whole: nobody is picked one by one. Whole means
     * everyone who can come -- not those the gérant set aside, which is what
     * being set aside is for, not suspended accounts, which cannot sign in to
     * use it, and not those already on the team.
     *
     * @param actorId the owner or an admin, who is in the group
     * @param projectId the project
     * @param groupId the group
     * @return the team, newcomers included
     * @throws ApiException 404 if the project or the group does not exist;
     *         403 for a plain member, or someone not in the group; 409 if
     *         nobody in the group can come
     */
    @Transactional
    public List<MemberResponse> addFromGroup(UUID actorId, UUID projectId, UUID groupId) {
        ProjectMember manager = access.requireManager(actorId, projectId);

        List<User> joining = joinersFromGroup(actorId, projectId, groupId);
        if (joining.isEmpty()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Personne à ajouter : tout le groupe est déjà dans le projet, en retrait ou suspendu."
            );
        }
        bringOn(manager.getProject(), manager.getUser(), joining);

        return projectMemberRepository.findAllForProject(projectId).stream()
                .map(MemberResponse::from)
                .toList();
    }

    private List<User> joinersFromGroup(UUID actorId, UUID projectId, UUID groupId) {
        if (!groupRepository.existsById(groupId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Groupe introuvable.");
        }
        if (!groupMemberRepository.existsByGroupIdAndUserId(groupId, actorId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tu ne fais pas partie de ce groupe.");
        }

        Set<UUID> onTheTeam = projectMemberRepository.findUserIdsByProjectId(projectId);
        return groupMemberRepository.findAllForGroups(List.of(groupId)).stream()
                .filter(membership -> !membership.isOnHold())
                .map(UserGroupMember::getUser)
                .filter(user -> !user.isSuspended())
                .filter(user -> !onTheTeam.contains(user.getId()))
                .toList();
    }

    private void bringOn(Project project, User actor, List<User> joining) {
        if (joining.isEmpty()) {
            return;
        }

        invitationRepository.deleteOutstandingFor(project.getId(), joining.stream().map(User::getId).toList());
        projectMemberRepository.saveAll(joining.stream()
                .map(user -> new ProjectMember(project, user, ProjectRole.MEMBER))
                .toList());

        joining.stream()
                .filter(user -> !user.getId().equals(actor.getId()))
                .forEach(user -> notificationService.notify(
                        user, NotificationType.ADDED_TO_PROJECT, project, actor, null));
    }

    /**
     * Takes someone off the team, or lets them leave when actor and member
     * are the same person. Their tasks stay and lose their assignee. Someone
     * removed is told why, with the optional message; someone leaving tells
     * the owner and the admins.
     *
     * @param actorId the person removing, or the member leaving
     * @param projectId the project
     * @param memberId the member to take off
     * @param message a word of explanation, or null
     * @throws ApiException 404 if the project does not exist or the person
     *         is not on it; 409 for the owner, who must hand the project over
     *         first; 403 for a plain member removing someone, or an admin
     *         removing another admin
     */
    @Transactional
    public void removeMember(UUID actorId, UUID projectId, UUID memberId, String message) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable."));

        if (project.getOwner().getId().equals(memberId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Le propriétaire doit d'abord céder le projet à quelqu'un d'autre."
            );
        }

        ProjectMember target = requireMemberOf(projectId, memberId);

        if (!actorId.equals(memberId)) {
            ProjectMember actor = access.requireManager(actorId, projectId);
            if (actor.getRole() == ProjectRole.ADMIN && target.getRole() != ProjectRole.MEMBER) {
                throw new ApiException(
                        HttpStatus.FORBIDDEN,
                        "Un administrateur ne peut retirer que des membres."
                );
            }
        } else {
            access.requireMembership(actorId, projectId);
        }

        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable."));

        taskService.unassignMember(projectId, memberId);
        projectMemberRepository.delete(target);

        if (actorId.equals(memberId)) {
            projectMemberRepository.findAllForProject(projectId).stream()
                    .filter(m -> m.getRole().manages())
                    .filter(m -> !m.getUser().getId().equals(actorId))
                    .forEach(m -> notificationService.notify(
                            m.getUser(), NotificationType.MEMBER_LEFT_PROJECT, project, actor, message));
        } else {
            notificationService.notify(
                    target.getUser(), NotificationType.REMOVED_FROM_PROJECT, project, actor, message);
        }
    }


    private void applyStatus(Project project, ProjectStatus status) {
        if (status == project.getStatus()) {
            return;
        }

        project.setStatus(status);
        project.setCompletedAt(status == ProjectStatus.ACHEVE ? Instant.now() : null);
    }

    private ProjectMember requireMemberOf(UUID projectId, UUID memberId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, memberId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cette personne ne fait pas partie du projet."
                ));
    }
}
