package io.mura.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/** The invitations to join a project. */
public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {

    /**
     * Whether a person has an invitation in a given state for a project.
     *
     * @param projectId the project
     * @param invitedUserId the invitee
     * @param status the state to look for
     * @return true if at least one such invitation exists
     */
    boolean existsByProjectIdAndInvitedUserIdAndStatus(UUID projectId, UUID invitedUserId, InvitationStatus status);

    /**
     * A person's invitations in a given state for a project. Used so that
     * re-inviting someone who said no replaces their refusal rather than
     * stacking a second row beside it.
     *
     * @param projectId the project
     * @param invitedUserId the invitee
     * @param status the state to look for
     * @return the matching invitations
     */
    List<ProjectInvitation> findAllByProjectIdAndInvitedUserIdAndStatus(
            UUID projectId, UUID invitedUserId, InvitationStatus status
    );

    /**
     * Deletes what these people still had on this project -- waiting,
     * refused or lapsed -- once they join it outright, for all of them at
     * once. A statement rather than delete(entity), see
     * {@link io.mura.group.UserGroupRepository#deleteGroupById}.
     *
     * @param projectId the project
     * @param userIds the people joining it
     * @return the number of invitations removed
     */
    @Modifying(flushAutomatically = true)
    @Query("""
            DELETE FROM ProjectInvitation i
            WHERE i.project.id = :projectId
              AND i.invitedUser.id IN :userIds
              AND i.status <> io.mura.project.InvitationStatus.ACCEPTED
            """)
    int deleteOutstandingFor(@Param("projectId") UUID projectId, @Param("userIds") Collection<UUID> userIds);

    /**
     * A project's invitations that did not end in a member: waiting,
     * refused or lapsed. Both sides are joined eagerly: the project page
     * shows who was invited and by whom.
     *
     * @param projectId the project
     * @return its open invitations, oldest first
     */
    @Query("""
            SELECT i FROM ProjectInvitation i
            JOIN FETCH i.invitedUser
            JOIN FETCH i.invitedBy
            JOIN FETCH i.project
            WHERE i.project.id = :projectId AND i.status <> io.mura.project.InvitationStatus.ACCEPTED
            ORDER BY i.createdAt
            """)
    List<ProjectInvitation> findAllOpenForProject(@Param("projectId") UUID projectId);

    /**
     * The invitations a person received in a given state, with the project
     * and its owner: the home page shows which project each one is for.
     *
     * @param userId the invitee
     * @param status the state to look for
     * @return their invitations, oldest first
     */
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

    /**
     * Invitations this person received or sent, whatever became of them,
     * for the export of their own data.
     *
     * @param userId the person
     * @return their invitations, newest first
     */
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
