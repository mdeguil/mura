package io.mura.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {

    boolean existsByProjectIdAndInvitedUserIdAndStatus(UUID projectId, UUID invitedUserId, InvitationStatus status);

    // Re-inviting someone who said no replaces their refusal rather than
    // stacking a second row beside it.
    List<ProjectInvitation> findAllByProjectIdAndInvitedUserIdAndStatus(
            UUID projectId, UUID invitedUserId, InvitationStatus status
    );

    // Both sides are joined eagerly: the project page shows who was invited,
    // and the home page shows which project each invitation is for.
    @Query("""
            SELECT i FROM ProjectInvitation i
            JOIN FETCH i.invitedUser
            JOIN FETCH i.invitedBy
            JOIN FETCH i.project
            WHERE i.project.id = :projectId AND i.status <> io.mura.project.InvitationStatus.ACCEPTED
            ORDER BY i.createdAt
            """)
    List<ProjectInvitation> findAllOpenForProject(@Param("projectId") UUID projectId);

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

    // Invitations this person received or sent, whatever became of them,
    // for the export of their own data.
    @Query("""
            SELECT i FROM ProjectInvitation i
            JOIN FETCH i.invitedUser
            JOIN FETCH i.invitedBy
            JOIN FETCH i.project
            WHERE i.invitedUser.id = :userId OR i.invitedBy.id = :userId
            ORDER BY i.createdAt DESC
            """)
    List<ProjectInvitation> findAllInvolving(@Param("userId") UUID userId);
}
