package io.mura.task;

import io.mura.common.exception.ApiException;
import io.mura.project.ProjectAccessGuard;
import io.mura.task.dto.CreateSubtaskRequest;
import io.mura.task.dto.SubtaskResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * A task's subtasks. Any member of the project can add, tick off and delete
 * them, not just its owner.
 */
@Service
@RequiredArgsConstructor
public class SubtaskService {

    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;
    private final ProjectAccessGuard access;

    /**
     * Adds a subtask, not ticked off.
     *
     * @param userId a member of the project
     * @param projectId the project
     * @param taskId the task
     * @param request the subtask's name
     * @return the subtask
     * @throws ApiException 404 if the project does not exist or the task is
     *         not one of its tasks, 403 if the caller is not on the team
     */
    @Transactional
    public SubtaskResponse create(UUID userId, UUID projectId, UUID taskId, CreateSubtaskRequest request) {
        Task task = requireAccessibleTask(userId, projectId, taskId);

        Subtask subtask = new Subtask();
        subtask.setTask(task);
        subtask.setName(request.name());
        subtaskRepository.save(subtask);

        return SubtaskResponse.from(subtask);
    }

    /**
     * Ticks a subtask off, or reopens it.
     *
     * @param userId a member of the project
     * @param projectId the project
     * @param taskId the task
     * @param subtaskId the subtask
     * @return the subtask, flipped
     * @throws ApiException 404 if the project, the task or the subtask does
     *         not exist or they do not belong together, 403 if the caller is
     *         not on the team
     */
    @Transactional
    public SubtaskResponse toggle(UUID userId, UUID projectId, UUID taskId, UUID subtaskId) {
        requireAccessibleTask(userId, projectId, taskId);
        Subtask subtask = requireSubtaskInTask(taskId, subtaskId);
        subtask.setDone(!subtask.isDone());
        return SubtaskResponse.from(subtask);
    }

    /**
     * Deletes a subtask.
     *
     * @param userId a member of the project
     * @param projectId the project
     * @param taskId the task
     * @param subtaskId the subtask
     * @throws ApiException 404 if the project, the task or the subtask does
     *         not exist or they do not belong together, 403 if the caller is
     *         not on the team
     */
    @Transactional
    public void delete(UUID userId, UUID projectId, UUID taskId, UUID subtaskId) {
        requireAccessibleTask(userId, projectId, taskId);
        Subtask subtask = requireSubtaskInTask(taskId, subtaskId);
        subtaskRepository.delete(subtask);
    }

    private Task requireAccessibleTask(UUID userId, UUID projectId, UUID taskId) {
        access.requireMembership(userId, projectId);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "error.task.notFound"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "error.task.notFound");
        }

        return task;
    }

    private Subtask requireSubtaskInTask(UUID taskId, UUID subtaskId) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Sous-tâche introuvable."));

        if (!subtask.getTask().getId().equals(taskId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Sous-tâche introuvable.");
        }

        return subtask;
    }
}
