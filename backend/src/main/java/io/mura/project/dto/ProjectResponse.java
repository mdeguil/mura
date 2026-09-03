package io.mura.project.dto;

import io.mura.member.dto.UserResponse;
import io.mura.project.Project;
import io.mura.project.ProjectStatus;
import io.mura.project.ProjectType;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

// "lists" isn't populated here: this DTO powers the projects list/summary
// endpoints. Full project content (lists + cards) belongs to a dedicated
// project-detail endpoint once that feature exists.
public record ProjectResponse(
        UUID id,
        String name,
        String description,
        String color,
        ProjectType type,
        LocalDate startDate,
        ProjectStatus status,
        UserResponse owner,
        List<UserResponse> members,
        List<Object> lists
) {
    public static ProjectResponse from(Project project) {
        UserResponse owner = UserResponse.from(project.getOwner());
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getColor(),
                project.getType(),
                project.getStartDate(),
                project.getStatus(),
                owner,
                List.of(owner),
                List.of()
        );
    }
}
