package io.mura.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {

    // The user is joined eagerly here: every caller renders the member list,
    // and the lazy association would otherwise fire a query per row. The role
    // is stored as text, so the order is spelled out rather than alphabetical
    // — owner, then admins, then members.
    String ORDER_BY_ROLE = """
            ORDER BY CASE m.role
                         WHEN io.mura.project.ProjectRole.OWNER THEN 0
                         WHEN io.mura.project.ProjectRole.ADMIN THEN 1
                         ELSE 2
                     END, u.username
            """;

    @Query("""
            SELECT m FROM ProjectMember m
            JOIN FETCH m.user u
            WHERE m.project.id = :projectId
            """ + ORDER_BY_ROLE)
    List<ProjectMember> findAllForProject(@Param("projectId") UUID projectId);

    // Batched variant for the projects list, which would otherwise run one
    // member query per project card.
    @Query("""
            SELECT m FROM ProjectMember m
            JOIN FETCH m.user u
            WHERE m.project.id IN :projectIds
            """ + ORDER_BY_ROLE)
    List<ProjectMember> findAllForProjects(@Param("projectIds") Collection<UUID> projectIds);

    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);

    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);
}
