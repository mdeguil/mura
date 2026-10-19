package io.mura.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {

    boolean existsByProjectIdAndInvitedUserIdAndStatus(UUID projectId, UUID invitedUserId, InvitationStatus status);

    // Both sides are joined eagerly: the project page shows who was invited,
    // and the home page shows which project each invitation is for.
    @Query("""
            SELECT i FROM ProjectInvitation i
            JOIN FETCH i.invitedUser
            JOIN FETCH i.invitedBy
            JOIN FETCH i.project
            WHERE i.project.id = :projectId AND i.status = :status
            ORDER BY i.createdAt
            """)
    List<ProjectInvitation> findAllForProject(
            @Param("projectId") UUID projectId,
            @Param("status") InvitationStatus status
    );

    @Query("""
            SELECT i FROM ProjectInvitation i
            JOIN FETCH i.invitedUser
            JOIN FETCH i.invitedBy
            JOIN FETCH i.project p
            JOIN FETCH p.owner
            WHERE i.invitedUser.id = :userId AND i.status = :status
            ORDER BY i.createdAt
            """)
    List<ProjectInvitation> findAllForUser(
            @Param("userId") UUID userId,
            @Param("status") InvitationStatus status
    );
}
