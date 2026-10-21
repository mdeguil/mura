package io.mura.group;

import org.springframework.data.jpa.repository.JpaRepository;
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
}
