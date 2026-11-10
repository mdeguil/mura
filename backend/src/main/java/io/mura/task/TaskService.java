package io.mura.task;

import io.mura.common.exception.ApiException;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.project.Project;
import io.mura.project.ProjectAccessGuard;
import io.mura.project.ProjectMemberRepository;
import io.mura.task.dto.CreateTaskRequest;
import io.mura.task.dto.TaskResponse;
import io.mura.task.dto.UpdateTaskRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * A project's tasks. Every member of a project works on its tasks:
 * ownership only decides who runs the team, not who plans the work.
 */
@Service
@RequiredArgsConstructor
public class TaskService {

    private static final Map<TaskStatus, Set<TaskStatus>> ALLOWED_STATUS_TRANSITIONS = Map.of(
            TaskStatus.A_FAIRE, EnumSet.of(TaskStatus.A_FAIRE, TaskStatus.EN_COURS),
            TaskStatus.EN_COURS, EnumSet.of(TaskStatus.EN_COURS, TaskStatus.TERMINE),
            TaskStatus.TERMINE, EnumSet.of(TaskStatus.TERMINE)
    );

    private final TaskRepository taskRepository;
    private final ProjectAccessGuard access;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    /**
     * A project's active tasks.
     *
     * @param userId the reader, who must be on the team
     * @param projectId the project
     * @return the tasks, by start date
     * @throws ApiException 404 if the project does not exist, 403 if the
     *         reader is not on it
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> listForProject(UUID userId, UUID projectId) {
        access.requireMembership(userId, projectId);
        return taskRepository.findAllForProject(projectId, false).stream()
                .map(TaskResponse::from)
                .toList();
    }

    /**
     * A project's archived tasks.
     *
     * @param userId the reader, who must be on the team
     * @param projectId the project
     * @return the archived tasks, by start date
     * @throws ApiException 404 if the project does not exist, 403 if the
     *         reader is not on it
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> listArchivedForProject(UUID userId, UUID projectId) {
        access.requireMembership(userId, projectId);
        return taskRepository.findAllForProject(projectId, true).stream()
                .map(TaskResponse::from)
                .toList();
    }

    /**
     * Creates a task, at the status asked for or À faire, and records its
     * creation as the first step of its history.
     *
     * @param userId a member of the project
     * @param projectId the project
     * @param request the task
     * @return the task
     * @throws ApiException 404 if the project does not exist, 403 if the
     *         caller is not on it, 409 if the assignee is not on it
     */
    @Transactional
    public TaskResponse create(UUID userId, UUID projectId, CreateTaskRequest request) {
        Project project = access.requireMembership(userId, projectId).getProject();

        Task task = new Task();
        task.setProject(project);
        task.setName(request.name());
        task.setDescription(request.description());
        task.setStatus(request.status() != null ? request.status() : TaskStatus.A_FAIRE);
        task.setStartDate(request.startDate());
        task.setEndDate(request.endDate());
        task.setAssignee(resolveAssignee(projectId, request.assigneeId()));
        task.getStatusHistory().add(statusChange(task, null, task.getStatus()));
        taskRepository.save(task);

        return TaskResponse.from(task);
    }

    /**
     * Replaces the whole task: fields left out of the request are cleared,
     * not kept. A change of status is recorded in the task's history.
     *
     * @param userId a member of the project
     * @param projectId the project
     * @param taskId the task
     * @param request the task's new state
     * @return the task
     * @throws ApiException 404 if the project or the task does not exist,
     *         403 if the caller is not on the team; 409 if the status goes
     *         backward or skips a stage, if it reaches Terminé with a
     *         subtask still open, or if the assignee is not on the team
     */
    @Transactional
    public TaskResponse update(UUID userId, UUID projectId, UUID taskId, UpdateTaskRequest request) {
        access.requireMembership(userId, projectId);
        Task task = requireTaskInProject(projectId, taskId);

        if (!ALLOWED_STATUS_TRANSITIONS.get(task.getStatus()).contains(request.status())) {
            throw new ApiException(HttpStatus.CONFLICT, "error.task.badStatus");
        }

        if (request.status() == TaskStatus.TERMINE && task.getSubtasks().stream().anyMatch(s -> !s.isDone())) {
            throw new ApiException(HttpStatus.CONFLICT, "error.task.subtasksFirst");
        }

        if (request.status() != task.getStatus()) {
            task.getStatusHistory().add(statusChange(task, task.getStatus(), request.status()));
        }

        task.setName(request.name());
        task.setDescription(request.description());
        task.setStatus(request.status());
        task.setStartDate(request.startDate());
        task.setEndDate(request.endDate());
        task.setAssignee(resolveAssignee(projectId, request.assigneeId()));

        return TaskResponse.from(task);
    }

    /**
     * Archives a task: it leaves the board and the planning, and nothing is
     * lost.
     *
     * @param userId a member of the project
     * @param projectId the project
     * @param taskId the task
     * @return the task, archived
     * @throws ApiException 404 if the project or the task does not exist,
     *         403 if the caller is not on the team
     */
    @Transactional
    public TaskResponse archive(UUID userId, UUID projectId, UUID taskId) {
        access.requireMembership(userId, projectId);
        Task task = requireTaskInProject(projectId, taskId);
        task.setArchived(true);
        return TaskResponse.from(task);
    }

    /**
     * Brings an archived task back onto the board and the planning.
     *
     * @param userId a member of the project
     * @param projectId the project
     * @param taskId the task
     * @return the task
     * @throws ApiException 404 if the project or the task does not exist,
     *         403 if the caller is not on the team
     */
    @Transactional
    public TaskResponse restore(UUID userId, UUID projectId, UUID taskId) {
        access.requireMembership(userId, projectId);
        Task task = requireTaskInProject(projectId, taskId);
        task.setArchived(false);
        return TaskResponse.from(task);
    }

    /**
     * Removes the task for good, subtasks and history with it.
     *
     * @param userId a member of the project
     * @param projectId the project
     * @param taskId the task
     * @throws ApiException 404 if the project or the task does not exist,
     *         403 if the caller is not on the team, 409 unless the task was
     *         archived first
     */
    @Transactional
    public void delete(UUID userId, UUID projectId, UUID taskId) {
        access.requireMembership(userId, projectId);
        Task task = requireTaskInProject(projectId, taskId);

        if (!task.isArchived()) {
            throw new ApiException(HttpStatus.CONFLICT, "error.task.archiveFirst");
        }

        taskRepository.delete(task);
    }

    /**
     * Called when someone leaves a project: their tasks stay, but they are
     * no longer the person in charge of them.
     *
     * @param projectId the project
     * @param userId the person leaving
     */
    @Transactional
    public void unassignMember(UUID projectId, UUID userId) {
        taskRepository.clearAssignee(projectId, userId);
    }

    private User resolveAssignee(UUID projectId, UUID assigneeId) {
        if (assigneeId == null) {
            return null;
        }

        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, assigneeId)) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "error.task.assigneeNotMember"
            );
        }

        return userRepository.findById(assigneeId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "error.directory.userNotFound"));
    }

    private TaskStatusChange statusChange(Task task, TaskStatus from, TaskStatus to) {
        TaskStatusChange change = new TaskStatusChange();
        change.setTask(task);
        change.setFromStatus(from);
        change.setToStatus(to);
        change.setChangedAt(Instant.now());
        return change;
    }

    private Task requireTaskInProject(UUID projectId, UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "error.task.notFound"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "error.task.notFound");
        }

        return task;
    }
}
