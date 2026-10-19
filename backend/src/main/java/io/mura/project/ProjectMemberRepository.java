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
    // is stored as text, where MEMBER sorts before OWNER, so DESC is what
    // puts the owner at the top.
    @Query("""
            SELECT m FROM ProjectMember m
            JOIN FETCH m.user u
            WHERE m.project.id = :projectId
            ORDER BY m.role DESC, u.username
            """)
    List<ProjectMember> findAllForProject(@Param("projectId") UUID projectId);

    // Batched variant for the projects list, which would otherwise run one
    // member query per project card.
    @Query("""
            SELECT m FROM ProjectMember m
            JOIN FETCH m.user u
            WHERE m.project.id IN :projectIds
            ORDER BY m.role DESC, u.username
            """)
    List<ProjectMember> findAllForProjects(@Param("projectIds") Collection<UUID> projectIds);

    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);

    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);
}
