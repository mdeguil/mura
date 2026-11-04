package io.mura.group;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Who is in which group. */
public interface UserGroupMemberRepository extends JpaRepository<UserGroupMember, UserGroupMemberId> {

    /**
     * The members of several groups at once, with their accounts: one query
     * for a whole list of groups rather than one per group.
     *
     * @param groupIds the groups
     * @return their memberships, ordered by username
     */
    @Query("""
            SELECT m FROM UserGroupMember m
            JOIN FETCH m.user u
            WHERE m.group.id IN :groupIds
            ORDER BY u.username
            """)
    List<UserGroupMember> findAllForGroups(@Param("groupIds") Collection<UUID> groupIds);

    /**
     * One person's membership of one group.
     *
     * @param groupId the group
     * @param userId the person
     * @return the membership, if they are in it
     */
    Optional<UserGroupMember> findByGroupIdAndUserId(UUID groupId, UUID userId);

    /**
     * Whether a person is in a group.
     *
     * @param groupId the group
     * @param userId the person
     * @return true if they are a member, set aside or not
     */
    boolean existsByGroupIdAndUserId(UUID groupId, UUID userId);

    /**
     * Every group this person is in, with who runs it, for the export of
     * their own data.
     *
     * @param userId the person
     * @return their memberships, oldest first
     */
    @Query("""
            SELECT m FROM UserGroupMember m
            JOIN FETCH m.group g
            JOIN FETCH g.owner
            WHERE m.user.id = :userId
            ORDER BY m.joinedAt
            """)
    List<UserGroupMember> findAllForUser(@Param("userId") UUID userId);
}
