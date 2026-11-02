package io.mura.group;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserGroupMemberRepository extends JpaRepository<UserGroupMember, UserGroupMemberId> {

    @Query("""
            SELECT m FROM UserGroupMember m
            JOIN FETCH m.user u
            WHERE m.group.id IN :groupIds
            ORDER BY u.username
            """)
    List<UserGroupMember> findAllForGroups(@Param("groupIds") Collection<UUID> groupIds);

    Optional<UserGroupMember> findByGroupIdAndUserId(UUID groupId, UUID userId);

    boolean existsByGroupIdAndUserId(UUID groupId, UUID userId);
}
