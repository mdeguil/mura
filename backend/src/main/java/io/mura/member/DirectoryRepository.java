package io.mura.member;

import io.mura.project.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/**
 * The reads the carnet is worked out from. They cross projects on behalf of
 * one person, which is why they sit with the user rather than with the
 * project.
 */
public interface DirectoryRepository extends JpaRepository<User, UUID> {

    /**
     * Everyone on an active project the caller is also on, with that
     * project, so one query answers both "who do I know" and "what do we
     * share". Archived projects are left out.
     *
     * @param userId the caller
     * @return one row per shared membership, ordered by project name
     */
    @Query("""
            SELECT m FROM ProjectMember m
            JOIN FETCH m.user
            JOIN FETCH m.project p
            WHERE m.project.id IN (
                SELECT mine.project.id FROM ProjectMember mine WHERE mine.user.id = :userId
            )
              AND m.user.id <> :userId
              AND p.archived = false
            ORDER BY p.name
            """)
    List<ProjectMember> findSharedMemberships(@Param("userId") UUID userId);

    /**
     * The people this account has invited onto a project, whatever became
     * of the invitation: known, even with nothing in common yet.
     *
     * @param userId the account that sent the invitations
     * @return each invitee once
     */
    @Query("""
            SELECT DISTINCT i.invitedUser FROM ProjectInvitation i
            WHERE i.invitedBy.id = :userId AND i.invitedUser.id <> :userId
            """)
    List<User> findInvitedByMe(@Param("userId") UUID userId);

    /**
     * The people who have invited this account onto a project, whatever
     * became of the invitation.
     *
     * @param userId the account that was invited
     * @return each inviter once
     */
    @Query("""
            SELECT DISTINCT i.invitedBy FROM ProjectInvitation i
            WHERE i.invitedUser.id = :userId AND i.invitedBy.id <> :userId
            """)
    List<User> findWhoInvitedMe(@Param("userId") UUID userId);
}
