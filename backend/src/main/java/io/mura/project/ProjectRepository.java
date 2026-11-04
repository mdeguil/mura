package io.mura.project;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/** The projects. */
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    /**
     * The projects a person is on. Membership, not ownership: a project
     * someone was added to has to show up in their list just like the ones
     * they created. Archived ones drop out of everybody's list.
     *
     * @param userId the person
     * @return their active projects, newest first
     */
    @Query("""
            SELECT p FROM Project p
            JOIN ProjectMember m ON m.project = p
            WHERE m.user.id = :userId AND p.archived = false
            ORDER BY p.createdAt DESC
            """)
    List<Project> findAllForMember(@Param("userId") UUID userId);

    /**
     * An owner's bin. It is theirs alone: they are the only one who can
     * restore or delete, so they are the only one shown what is in it.
     *
     * @param ownerId the owner
     * @return their archived projects, most recently changed first
     */
    List<Project> findAllByOwnerIdAndArchivedTrueOrderByUpdatedAtDesc(UUID ownerId);

    /**
     * Every project an account owns, archived ones included: closing an
     * account has to account for all of them, not only the visible ones.
     *
     * @param ownerId the owner
     * @return their projects
     */
    List<Project> findAllByOwnerId(UUID ownerId);

    /**
     * How many projects are filed under one type, archived ones included.
     *
     * @param typeId the type
     * @return the number of projects
     */
    long countByTypeId(UUID typeId);

    /**
     * How many projects each type holds, in one query for the whole list.
     * A type nobody uses has no row.
     *
     * @return one count per type in use
     */
    @Query("SELECT p.type.id AS typeId, COUNT(p) AS projects FROM Project p GROUP BY p.type.id")
    List<TypeCount> countPerType();

    /** One row of {@link #countPerType()}. */
    interface TypeCount {
        /**
         * The type counted.
         *
         * @return the type's id
         */
        UUID getTypeId();

        /**
         * How many projects it holds.
         *
         * @return the number of projects
         */
        long getProjects();
    }

    /**
     * Moves every project of a type to another. Used when a type is
     * deleted: its projects move to the fallback before the row goes, so
     * the foreign key never has to refuse.
     *
     * @param typeId the type being deleted
     * @param fallbackId the type that takes its projects
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Project p SET p.type.id = :fallbackId WHERE p.type.id = :typeId")
    void reassignType(@Param("typeId") UUID typeId, @Param("fallbackId") UUID fallbackId);
}
