package io.mura.project.dto;

import io.mura.member.dto.UserResponse;
import io.mura.project.Project;
import io.mura.project.ProjectAccess;
import io.mura.project.ProjectMember;

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
        boolean archived,
        UserResponse owner,
        ProjectAccess access,
        List<MemberResponse> members,
        List<Object> lists
) {
    public static ProjectResponse from(Project project, ProjectAccess access, List<ProjectMember> members) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getColor(),
                project.getType(),
                project.getStartDate(),
                project.getStatus(),
                project.isArchived(),
                UserResponse.from(project.getOwner()),
                access,
                members.stream()
                        .map(access == ProjectAccess.MEMBER
                                ? MemberResponse::from
                                : MemberResponse::withoutEmail)
                        .toList(),
                List.of()
        );
    }
}
