package io.mura.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    // Membership, not ownership: a project someone was added to has to show
    // up in their list just like the ones they created. Archived ones drop
    // out of everybody's list.
    @Query("""
            SELECT p FROM Project p
            JOIN ProjectMember m ON m.project = p
            WHERE m.user.id = :userId AND p.archived = false
            ORDER BY p.createdAt DESC
            """)
    List<Project> findAllForMember(@Param("userId") UUID userId);

    // The bin is the owner's: they are the only one who can restore or
    // delete, so they are the only one shown what is in it.
    List<Project> findAllByOwnerIdAndArchivedTrueOrderByUpdatedAtDesc(UUID ownerId);
}
