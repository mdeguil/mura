package io.mura.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/** The tasks. */
public interface TaskRepository extends JpaRepository<Task, UUID> {

    /**
     * A project's tasks, active or archived. The assignee is fetched with the
     * rows: the board and both planning views show it on every card, which
     * would otherwise be one query per task.
     *
     * @param projectId the project
     * @param archived true for the archived tasks, false for the others
     * @return the tasks, by start date
     */
    @Query("""
            SELECT t FROM Task t
            LEFT JOIN FETCH t.assignee
            WHERE t.project.id = :projectId AND t.archived = :archived
            ORDER BY t.startDate ASC
            """)
    List<Task> findAllForProject(@Param("projectId") UUID projectId, @Param("archived") boolean archived);

    /**
     * How many tasks a person is in charge of, across projects.
     *
     * @param assigneeId the person
     * @return the number of tasks assigned to them
     */
    long countByAssigneeId(UUID assigneeId);

    /**
     * Leaves a project's tasks without assignee where they were one person's,
     * once that person leaves the team: the tasks stay, nobody is in charge.
     *
     * @param projectId the project
     * @param userId the person leaving
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Task t SET t.assignee = null WHERE t.project.id = :projectId AND t.assignee.id = :userId")
    void clearAssignee(@Param("projectId") UUID projectId, @Param("userId") UUID userId);

    /**
     * Every task a person is in charge of, across projects, for the export
     * of their own data.
     *
     * @param userId the person
     * @return their tasks with their projects, by start date
     */
    @Query("""
            SELECT t FROM Task t
            JOIN FETCH t.project
            WHERE t.assignee.id = :userId
            ORDER BY t.startDate
            """)
    List<Task> findAllAssignedTo(@Param("userId") UUID userId);
}
