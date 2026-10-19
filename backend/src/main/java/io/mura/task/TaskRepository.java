package io.mura.task;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    // The assignee is fetched with the rows: the board and both planning
    // views show it on every card, which would be one query per task.
    @Query("""
            SELECT t FROM Task t
            LEFT JOIN FETCH t.assignee
            WHERE t.project.id = :projectId AND t.archived = :archived
            ORDER BY t.startDate ASC
            """)
    List<Task> findAllForProject(@Param("projectId") UUID projectId, @Param("archived") boolean archived);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Task t SET t.assignee = null WHERE t.project.id = :projectId AND t.assignee.id = :userId")
    void clearAssignee(@Param("projectId") UUID projectId, @Param("userId") UUID userId);
}
