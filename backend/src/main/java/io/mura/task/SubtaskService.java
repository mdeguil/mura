package io.mura.task;

import io.mura.common.exception.ApiException;
import io.mura.project.ProjectMemberRepository;
import io.mura.project.ProjectRepository;
import io.mura.task.dto.CreateSubtaskRequest;
import io.mura.task.dto.SubtaskResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SubtaskService {

    private final SubtaskRepository subtaskRepository;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;

    @Transactional
    public SubtaskResponse create(UUID userId, UUID projectId, UUID taskId, CreateSubtaskRequest request) {
        Task task = requireAccessibleTask(userId, projectId, taskId);

        Subtask subtask = new Subtask();
        subtask.setTask(task);
        subtask.setName(request.name());
        subtaskRepository.save(subtask);

        return SubtaskResponse.from(subtask);
    }

    @Transactional
    public SubtaskResponse toggle(UUID userId, UUID projectId, UUID taskId, UUID subtaskId) {
        requireAccessibleTask(userId, projectId, taskId);
        Subtask subtask = requireSubtaskInTask(taskId, subtaskId);
        subtask.setDone(!subtask.isDone());
        return SubtaskResponse.from(subtask);
    }

    @Transactional
    public void delete(UUID userId, UUID projectId, UUID taskId, UUID subtaskId) {
        requireAccessibleTask(userId, projectId, taskId);
        Subtask subtask = requireSubtaskInTask(taskId, subtaskId);
        subtaskRepository.delete(subtask);
    }

    // Any member of the project can tick off subtasks, not just its owner.
    private Task requireAccessibleTask(UUID userId, UUID projectId, UUID taskId) {
        if (!projectRepository.existsById(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable.");
        }

        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tu n'as pas accès à ce projet.");
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tâche introuvable."));

        if (!task.getProject().getId().equals(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Tâche introuvable.");
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
