package io.mura.group;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface UserGroupRepository extends JpaRepository<UserGroup, UUID> {

    // Membership, not ownership: the carnet shows the groups you belong to,
    // whoever made them.
    @Query("""
            SELECT g FROM UserGroup g
            JOIN FETCH g.owner
            JOIN UserGroupMember m ON m.group = g
            WHERE m.user.id = :userId
            ORDER BY g.name
            """)
    List<UserGroup> findAllForMember(@Param("userId") UUID userId);

    // The groups this account made, which disappear with it: a group is a
    // list of people, not something its members own a share of.
    List<UserGroup> findAllByOwnerId(UUID ownerId);

    // A statement rather than delete(entity), for the same reason account
    // deletion uses one: once notifications have been written earlier in the
    // same transaction, the entity-level delete emits no SQL at all. The
    // request answered 204 and the group was still there.
    //
    // The row count makes that impossible to miss again, and the database
    // finishes the job -- memberships are ON DELETE CASCADE, and the
    // notifications that pointed at the group are ON DELETE SET NULL, which
    // is how the news of a deletion outlives what it is about.
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM UserGroup g WHERE g.id = :id")
    int deleteGroupById(@Param("id") UUID id);
}
