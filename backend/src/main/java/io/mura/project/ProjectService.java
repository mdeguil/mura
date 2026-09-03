package io.mura.project;

import io.mura.common.exception.ApiException;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.project.dto.CreateProjectRequest;
import io.mura.project.dto.ProjectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final String DEFAULT_COLOR = "#14b8a6";

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    public List<ProjectResponse> listForUser(UUID userId) {
        return projectRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId).stream()
                .map(ProjectResponse::from)
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

        projectMemberRepository.save(new ProjectMember(project, owner, "OWNER"));

        return ProjectResponse.from(project);
    }
}
