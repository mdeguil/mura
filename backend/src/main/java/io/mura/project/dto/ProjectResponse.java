package io.mura.project.dto;

import io.mura.member.dto.UserResponse;
import io.mura.project.Project;
import io.mura.project.ProjectAccess;
import io.mura.project.ProjectMember;

import io.mura.project.ProjectStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * A project as the reader may see it.
 *
 * @param id the project's id
 * @param name its name
 * @param description its description, or null
 * @param color its colour, as {@code #rrggbb}
 * @param type what it is filed under
 * @param startDate when it starts, or null
 * @param status where its work stands
 * @param completedAt when it reached ACHEVE, or null at any other status
 * @param archived whether it is in the bin
 * @param owner who owns it
 * @param access whether the reader is on the team or only invited
 * @param members its team; addresses are left out for a reader who is
 *        only invited
 * @param lists always empty: left over from the first scaffold, where a
 *        project held lists of cards
 */
public record ProjectResponse(
        UUID id,
        String name,
        String description,
        String color,
        ProjectTypeResponse type,
        LocalDate startDate,
        ProjectStatus status,
        Instant completedAt,
        boolean archived,
        UserResponse owner,
        ProjectAccess access,
        List<MemberResponse> members,
        List<Object> lists
) {
    /**
     * Reads a project for a reader with the given access.
     *
     * @param project the project, with its type and owner loaded
     * @param access what the reader may see
     * @param members its memberships, with their users loaded
     * @return the project as that reader sees it
     */
    public static ProjectResponse from(Project project, ProjectAccess access, List<ProjectMember> members) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getColor(),
                ProjectTypeResponse.from(project.getType()),
                project.getStartDate(),
                project.getStatus(),
                project.getCompletedAt(),
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
