package io.mura.task;

import io.mura.common.exception.ApiException;
import io.mura.project.Project;
import io.mura.project.ProjectRepository;
import io.mura.task.dto.CreateTaskRequest;
import io.mura.task.dto.TaskResponse;
import io.mura.task.dto.UpdateTaskRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;

    public List<TaskResponse> listForProject(UUID userId, UUID projectId) {
        requireOwnedProject(userId, projectId);
        return taskRepository.findAllByProjectIdAndArchivedOrderByStartDateAsc(projectId, false).stream()
                .map(TaskResponse::from)
                .toList();
    }

    public List<TaskResponse> listArchivedForProject(UUID userId, UUID projectId) {
        requireOwnedProject(userId, projectId);
        return taskRepository.findAllByProjectIdAndArchivedOrderByStartDateAsc(projectId, true).stream()
                .map(TaskResponse::from)
                .toList();
    }

    @Transactional
    public TaskResponse create(UUID userId, UUID projectId, CreateTaskRequest request) {
        Project project = requireOwnedProject(userId, projectId);

        Task task = new Task();
        task.setProject(project);
        task.setName(request.name());
        task.setDescription(request.description());
        task.setStatus(request.status() != null ? request.status() : TaskStatus.A_FAIRE);
        task.setStartDate(request.startDate());
        task.setEndDate(request.endDate());
        taskRepository.save(task);

        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse update(UUID userId, UUID projectId, UUID taskId, UpdateTaskRequest request) {
        requireOwnedProject(userId, projectId);
        Task task = requireTaskInProject(projectId, taskId);

        task.setName(request.name());
        task.setDescription(request.description());
        task.setStatus(request.status());
        task.setStartDate(request.startDate());
        task.setEndDate(request.endDate());

        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse archive(UUID userId, UUID projectId, UUID taskId) {
        requireOwnedProject(userId, projectId);
        Task task = requireTaskInProject(projectId, taskId);
        task.setArchived(true);
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse restore(UUID userId, UUID projectId, UUID taskId) {
        requireOwnedProject(userId, projectId);
        Task task = requireTaskInProject(projectId, taskId);
        task.setArchived(false);
        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(UUID userId, UUID projectId, UUID taskId) {
        requireOwnedProject(userId, projectId);
        Task task = requireTaskInProject(projectId, taskId);

        if (!task.isArchived()) {
            throw new ApiException(HttpStatus.CONFLICT, "La tâche doit être archivée avant d'être supprimée.");
        }

        taskRepository.delete(task);
    }

    private Project requireOwnedProject(UUID userId, UUID projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Projet introuvable."));

        if (!project.getOwner().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tu n'as pas accès à ce projet.");
        }

        return project;
    }

    private Task requireTaskInProject(UUID projectId, UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Tâche introuvable."));

        if (!task.getProject().getId().equals(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Tâche introuvable.");
        }

        return task;
    }
}
