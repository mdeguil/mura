package io.mura.project;

import io.mura.common.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Who may act on a project, for every service that acts on one. Each check
 * answers 404 when the project does not exist before it answers 403, so a
 * refusal reads the same whichever screen it comes from.
 */
@Component
@RequiredArgsConstructor
public class ProjectAccessGuard {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository memberRepository;

    /**
     * The caller's place on the team. Every member works on the tasks:
     * the role only decides who runs the team.
     *
     * @throws ApiException 404 if the project does not exist, 403 if the caller is not on it
     */
    public ProjectMember requireMembership(UUID userId, UUID projectId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable.");
        }

        return memberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "Tu n'as pas accès à ce projet."));
    }

    /**
     * As {@link #requireMembership}, for what running the team takes:
     * editing the project, inviting, bringing a group, removing members.
     *
     * @throws ApiException 403 as well if the caller is a plain member
     */
    public ProjectMember requireManager(UUID userId, UUID projectId) {
        ProjectMember membership = requireMembership(userId, projectId);

        if (!membership.getRole().manages()) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Il faut être propriétaire ou administrateur de ce projet."
            );
        }

        return membership;
    }

    /**
     * For what stays with the owner alone: roles, handing the project over,
     * the bin.
     *
     * @throws ApiException 404 if the project does not exist, 403 for anyone but its owner
     */
    public Project requireOwner(UUID userId, UUID projectId) {
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
