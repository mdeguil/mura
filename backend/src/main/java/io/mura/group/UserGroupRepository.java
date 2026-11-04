package io.mura.group;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/** The groups. */
public interface UserGroupRepository extends JpaRepository<UserGroup, UUID> {

    /**
     * The groups a person belongs to, whoever runs them: membership, not
     * ownership, is what the carnet shows.
     *
     * @param userId the person
     * @return their groups with their gérant, ordered by name
     */
    @Query("""
            SELECT g FROM UserGroup g
            JOIN FETCH g.owner
            JOIN UserGroupMember m ON m.group = g
            WHERE m.user.id = :userId
            ORDER BY g.name
            """)
    List<UserGroup> findAllForMember(@Param("userId") UUID userId);

    /**
     * Every group with its gérant, for the administration list: the lazy
     * owner would otherwise cost a query per row.
     *
     * @return all groups, in no particular order
     */
    @Query("SELECT g FROM UserGroup g JOIN FETCH g.owner")
    List<UserGroup> findAllWithOwner();

    /**
     * The groups an account runs, which disappear with it: a group is a list
     * of people, not something its members own a share of.
     *
     * @param ownerId the gérant
     * @return their groups
     */
    List<UserGroup> findAllByOwnerId(UUID ownerId);

    /**
     * Deletes a group by statement rather than delete(entity), for the same
     * reason account deletion uses one: once notifications have been written
     * earlier in the same transaction, the entity-level delete emits no SQL
     * at all. The request answered 204 and the group was still there.
     *
     * <p>The row count makes that impossible to miss again, and the database
     * finishes the job -- memberships are ON DELETE CASCADE, and the
     * notifications that pointed at the group are ON DELETE SET NULL, which
     * is how the news of a deletion outlives what it is about.
     *
     * @param id the group
     * @return the number of rows removed: 1, or 0 if it was already gone
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserGroup g WHERE g.id = :id")
    int deleteGroupById(@Param("id") UUID id);
}
