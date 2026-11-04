package io.mura.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** Who is on which project, and with what role. */
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {

    /**
     * The order team lists read in. The role is stored as text, so the order
     * is spelled out rather than alphabetical -- owner, then admins, then
     * members, each by username.
     */
    String ORDER_BY_ROLE = """
            ORDER BY CASE m.role
                         WHEN io.mura.project.ProjectRole.OWNER THEN 0
                         WHEN io.mura.project.ProjectRole.ADMIN THEN 1
                         ELSE 2
                     END, u.username
            """;

    /**
     * A project's team, with each member's account joined eagerly: every
     * caller renders the list, and the lazy association would otherwise
     * fire a query per row.
     *
     * @param projectId the project
     * @return its members, in {@link #ORDER_BY_ROLE}
     */
    @Query("""
            SELECT m FROM ProjectMember m
            JOIN FETCH m.user u
            WHERE m.project.id = :projectId
            """ + ORDER_BY_ROLE)
    List<ProjectMember> findAllForProject(@Param("projectId") UUID projectId);

    /**
     * The teams of several projects at once, for the projects list, which
     * would otherwise run one member query per project card.
     *
     * @param projectIds the projects
     * @return their members, in {@link #ORDER_BY_ROLE}
     */
    @Query("""
            SELECT m FROM ProjectMember m
            JOIN FETCH m.user u
            WHERE m.project.id IN :projectIds
            """ + ORDER_BY_ROLE)
    List<ProjectMember> findAllForProjects(@Param("projectIds") Collection<UUID> projectIds);

    /**
     * One person's membership of one project.
     *
     * @param projectId the project
     * @param userId the person
     * @return the membership, if they are on the team
     */
    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);

    /**
     * Whether a person is on a project's team.
     *
     * @param projectId the project
     * @param userId the person
     * @return true if they are a member, whatever their role
     */
    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);

    /**
     * Who is on the team, by id only: enough to tell a newcomer apart
     * without one query per person.
     *
     * @param projectId the project
     * @return the ids of its members
     */
    @Query("SELECT m.user.id FROM ProjectMember m WHERE m.project.id = :projectId")
    Set<UUID> findUserIdsByProjectId(@Param("projectId") UUID projectId);

    /**
     * Every project this person is on, archived ones included, with its
     * owner, for the export of their own data.
     *
     * @param userId the person
     * @return their memberships, oldest first
     */
    @Query("""
            SELECT m FROM ProjectMember m
            JOIN FETCH m.project p
            JOIN FETCH p.owner
            WHERE m.user.id = :userId
            ORDER BY m.joinedAt
            """)
    List<ProjectMember> findAllForUser(@Param("userId") UUID userId);
}
