package io.mura.project;

import io.mura.common.exception.ApiException;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.project.dto.CreateProjectRequest;
import io.mura.project.dto.MemberResponse;
import io.mura.project.dto.ProjectResponse;
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

        return ProjectResponse.from(project, ProjectAccess.MEMBER, List.of(membership));
    }

    @Transactional
    public void removeMember(UUID actorId, UUID projectId, UUID memberId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable."));

        // The owner manages the team; anyone else may still show themselves
        // out, which is the only case where actor and target are the same.
        boolean leavingOnOwnAccord = actorId.equals(memberId);
        if (!leavingOnOwnAccord) {
            requireOwner(actorId, projectId);
        } else if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, actorId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tu n'as pas accès à ce projet.");
        }

        if (project.getOwner().getId().equals(memberId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Le propriétaire ne peut pas être retiré de son propre projet."
            );
        }

        ProjectMember membership = projectMemberRepository.findByProjectIdAndUserId(projectId, memberId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Ce membre ne fait pas partie du projet."));

        // Their tasks stay, but nobody is in charge of them any more: leaving
        // a dangling assignee would show a name that can no longer act on it.
        taskService.unassignMember(projectId, memberId);
        projectMemberRepository.delete(membership);
    }

    private ProjectMember requireMembership(UUID userId, UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable.");
        }

        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Tu n'as pas accès à ce projet."));
    }

    private Project requireOwner(UUID userId, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable."));

        if (!project.getOwner().getId().equals(userId)) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Seul le propriétaire du projet peut gérer ses membres."
            );
        }

        return project;
    }
}
