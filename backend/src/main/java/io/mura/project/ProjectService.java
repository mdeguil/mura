package io.mura.project;

import io.mura.common.exception.ApiException;
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

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final String DEFAULT_COLOR = "#14b8a6";

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final TaskService taskService;
    private final InvitationService invitationService;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public List<ProjectResponse> listForUser(UUID userId) {
        List<Project> projects = projectRepository.findAllForMember(userId);
        if (projects.isEmpty()) {
            return List.of();
        }

        Map<UUID, List<ProjectMember>> membersByProject = projectMemberRepository
                .findAllForProjects(projects.stream().map(Project::getId).toList())
                .stream()
                // Read through the embedded id rather than getProject(): the
                // association is a lazy proxy, and this keeps it uninitialised.
                .collect(Collectors.groupingBy(member -> member.getId().getProjectId()));

        return projects.stream()
                .map(project -> ProjectResponse.from(
                        project,
                        ProjectAccess.MEMBER,
                        membersByProject.getOrDefault(project.getId(), List.of())
                ))
                .toList();
    }

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

        // Someone holding a live invitation may read what they are being
        // invited to before deciding: the facts, the description and who is
        // already on the team. Not what the team is working on, and not
        // their email addresses: ProjectResponse drops those for anyone
        // who is not a member yet.
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

    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers(UUID userId, UUID projectId) {
        requireMembership(userId, projectId);
        return projectMemberRepository.findAllForProject(projectId).stream()
                .map(MemberResponse::from)
                .toList();
    }


    @Transactional(readOnly = true)
    public List<ProjectResponse> listArchivedForUser(UUID ownerId) {
        return projectRepository.findAllByOwnerIdAndArchivedTrueOrderByUpdatedAtDesc(ownerId).stream()
                .map(project -> ProjectResponse.from(project, ProjectAccess.MEMBER, List.of()))
                .toList();
    }

    // Editing the project's details is part of running it, so admins may do
    // it too. Putting it in the bin is not: that stays with the owner.
    @Transactional
    public ProjectResponse update(UUID actorId, UUID projectId, UpdateProjectRequest request) {
        requireManager(actorId, projectId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable."));

        project.setName(request.name());
        project.setDescription(request.description());
        project.setColor(StringUtils.hasText(request.color()) ? request.color() : DEFAULT_COLOR);
        project.setType(request.type());
        project.setStartDate(request.startDate());
        project.setStatus(request.status());

        return ProjectResponse.from(
                project,
                ProjectAccess.MEMBER,
                projectMemberRepository.findAllForProject(projectId)
        );
    }

    @Transactional
    public ProjectResponse archive(UUID actorId, UUID projectId) {
        Project project = requireOwner(actorId, projectId);
        project.setArchived(true);
        return ProjectResponse.from(project, ProjectAccess.MEMBER, List.of());
    }

    @Transactional
    public ProjectResponse restore(UUID actorId, UUID projectId) {
        Project project = requireOwner(actorId, projectId);
        project.setArchived(false);
        return ProjectResponse.from(
                project,
                ProjectAccess.MEMBER,
                projectMemberRepository.findAllForProject(projectId)
        );
    }

    // Everything hanging off the project goes with it — tasks, subtasks,
    // status history, members, invitations — which is why it has to sit in
    // the bin first.
    @Transactional
    public void delete(UUID actorId, UUID projectId) {
        Project project = requireOwner(actorId, projectId);

        if (!project.isArchived()) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Le projet doit être archivé avant d'être supprimé."
            );
        }

        projectRepository.delete(project);
    }
    @Transactional
    public ProjectResponse create(UUID ownerId, CreateProjectRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable."));

        Project project = new Project();
        project.setName(request.name());
        project.setDescription(request.description());
        project.setColor(StringUtils.hasText(request.color()) ? request.color() : DEFAULT_COLOR);
        project.setType(request.type());
        project.setStartDate(request.startDate());
        project.setStatus(ProjectStatus.A_VENIR);
        project.setOwner(owner);
        projectRepository.save(project);

        ProjectMember membership = projectMemberRepository.save(
                new ProjectMember(project, owner, ProjectRole.OWNER)
        );

        invitationService.inviteAll(project, owner, request.invitedEmails());

        return ProjectResponse.from(project, ProjectAccess.MEMBER, List.of(membership));
    }


    @Transactional
    public MemberResponse changeRole(UUID actorId, UUID projectId, UUID memberId, ProjectRole role) {
        Project project = requireOwner(actorId, projectId);

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

    // Handing the project over, in one step: there is never a moment with two
    // owners or none. The previous owner stays on as an admin rather than
    // being dropped from a project they built.
    @Transactional
    public List<MemberResponse> transferOwnership(UUID actorId, UUID projectId, UUID newOwnerId) {
        Project project = requireOwner(actorId, projectId);

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

        // Anyone may show themselves out. Removing someone else takes a
        // manager, and an admin may only remove plain members — otherwise two
        // admins could show each other the door.
        if (!actorId.equals(memberId)) {
            ProjectMember actor = requireManager(actorId, projectId);
            if (actor.getRole() == ProjectRole.ADMIN && target.getRole() != ProjectRole.MEMBER) {
                throw new ApiException(
                        HttpStatus.FORBIDDEN,
                        "Un administrateur ne peut retirer que des membres."
                );
            }
        } else {
            requireMembership(actorId, projectId);
        }

        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Utilisateur introuvable."));

        // Their tasks stay, but nobody is in charge of them any more: leaving
        // a dangling assignee would show a name that can no longer act on it.
        taskService.unassignMember(projectId, memberId);
        projectMemberRepository.delete(target);

        if (actorId.equals(memberId)) {
            // Leaving: the people running the project are the ones who need
            // to know, and to read why.
            projectMemberRepository.findAllForProject(projectId).stream()
                    .filter(m -> m.getRole().manages())
                    // The delete above may not have flushed yet, so the
                    // leaver can still show up in that query.
                    .filter(m -> !m.getUser().getId().equals(actorId))
                    .forEach(m -> notificationService.notify(
                            m.getUser(), NotificationType.MEMBER_LEFT_PROJECT, project, actor, message));
        } else {
            notificationService.notify(
                    target.getUser(), NotificationType.REMOVED_FROM_PROJECT, project, actor, message);
        }
    }

    private ProjectMember requireMembership(UUID userId, UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable.");
        }

        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Tu n'as pas accès à ce projet."));
    }

    private ProjectMember requireMemberOf(UUID projectId, UUID memberId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, memberId)
                .orElseThrow(() -> new ApiException(
                        HttpStatus.NOT_FOUND,
                        "Cette personne ne fait pas partie du projet."
                ));
    }

    // Inviting, cancelling an invitation and removing members are open to the
    // owner and to admins alike.
    ProjectMember requireManager(UUID userId, UUID projectId) {
        ProjectMember membership = requireMembership(userId, projectId);

        if (!membership.getRole().manages()) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Il faut être propriétaire ou administrateur de ce projet."
            );
        }

        return membership;
    }

    private Project requireOwner(UUID userId, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable."));

        if (!project.getOwner().getId().equals(userId)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Seul le propriétaire du projet peut faire cela."
            );
        }

        return project;
    }
}
