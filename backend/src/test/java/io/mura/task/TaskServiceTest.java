package io.mura.task;

import io.mura.common.exception.ApiException;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.project.Project;
import io.mura.project.ProjectAccessGuard;
import io.mura.project.ProjectMemberRepository;
import io.mura.project.ProjectRepository;
import io.mura.project.ProjectRole;
import io.mura.support.Fixtures;
import io.mura.task.dto.CreateTaskRequest;
import io.mura.task.dto.TaskResponse;
import io.mura.task.dto.UpdateTaskRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private UserRepository userRepository;

    private TaskService service;

    private User alice;
    private Project project;

    @BeforeEach
    void setUp() {
        alice = Fixtures.user("alice");
        project = Fixtures.project("Refonte", alice);
        service = new TaskService(taskRepository, new ProjectAccessGuard(projectRepository, projectMemberRepository),
                projectMemberRepository, userRepository);
    }

    private void aliceIsAMember() {
        when(projectRepository.existsById(project.getId())).thenReturn(true);
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), alice.getId()))
                .thenReturn(Optional.of(Fixtures.member(project, alice, ProjectRole.MEMBER)));
    }

    private Task existing(TaskStatus status) {
        Task task = Fixtures.task(project, "Maquettes", status);
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        return task;
    }

    private UpdateTaskRequest update(TaskStatus status) {
        return new UpdateTaskRequest("Maquettes", null, status,
                LocalDate.parse("2026-03-01"), LocalDate.parse("2026-03-10"), null);
    }

    @Test
    void createStartsAtAFaireAndRecordsTheFirstStatus() {
        aliceIsAMember();

        TaskResponse created = service.create(alice.getId(), project.getId(), new CreateTaskRequest(
                "Maquettes", null, null, LocalDate.parse("2026-03-01"), LocalDate.parse("2026-03-10"), null));

        assertThat(created.status()).isEqualTo(TaskStatus.A_FAIRE);
        assertThat(created.statusHistory()).singleElement().satisfies(change -> {
            assertThat(change.fromStatus()).isNull();
            assertThat(change.toStatus()).isEqualTo(TaskStatus.A_FAIRE);
            assertThat(change.changedAt()).isNotNull();
        });
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void createAssignsOnlyAMemberOfTheProject() {
        aliceIsAMember();
        UUID outsider = UUID.randomUUID();
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), outsider)).thenReturn(false);

        assertThatThrownBy(() -> service.create(alice.getId(), project.getId(), new CreateTaskRequest(
                "Maquettes", null, null, LocalDate.parse("2026-03-01"), LocalDate.parse("2026-03-10"), outsider)))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
        verify(taskRepository, never()).save(any());
    }

    @Test
    void createResolvesAnAssigneeWhoIsAMember() {
        aliceIsAMember();
        User bob = Fixtures.user("bob");
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), bob.getId())).thenReturn(true);
        when(userRepository.findById(bob.getId())).thenReturn(Optional.of(bob));

        TaskResponse created = service.create(alice.getId(), project.getId(), new CreateTaskRequest(
                "Maquettes", null, TaskStatus.EN_COURS, LocalDate.parse("2026-03-01"),
                LocalDate.parse("2026-03-10"), bob.getId()));

        assertThat(created.assignee().username()).isEqualTo("bob");
        assertThat(created.status()).isEqualTo(TaskStatus.EN_COURS);
    }

    @Test
    void someoneOutsideTheProjectCannotReachItsTasks() {
        when(projectRepository.existsById(project.getId())).thenReturn(true);
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), alice.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.listForProject(alice.getId(), project.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void anUnknownProjectIsNotFound() {
        when(projectRepository.existsById(project.getId())).thenReturn(false);

        assertThatThrownBy(() -> service.listForProject(alice.getId(), project.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void listsAskForTheRightSideOfTheArchive() {
        aliceIsAMember();
        when(taskRepository.findAllForProject(project.getId(), false)).thenReturn(List.of());
        when(taskRepository.findAllForProject(project.getId(), true))
                .thenReturn(List.of(Fixtures.task(project, "Vieux lot", TaskStatus.TERMINE)));

        assertThat(service.listForProject(alice.getId(), project.getId())).isEmpty();
        assertThat(service.listArchivedForProject(alice.getId(), project.getId()))
                .extracting(TaskResponse::name).containsExactly("Vieux lot");
    }

    @ParameterizedTest(name = "{0} -> {1} autorisé : {2}")
    @CsvSource({
            "A_FAIRE, A_FAIRE, true",
            "A_FAIRE, EN_COURS, true",
            "A_FAIRE, TERMINE, false",
            "EN_COURS, TERMINE, true",
            "EN_COURS, A_FAIRE, false",
            "TERMINE, TERMINE, true",
            "TERMINE, EN_COURS, false",
            "TERMINE, A_FAIRE, false"
    })
    void aTaskOnlyMovesForwardOneStageAtATime(TaskStatus from, TaskStatus to, boolean allowed) {
        aliceIsAMember();
        Task task = existing(from);

        if (allowed) {
            assertThat(service.update(alice.getId(), project.getId(), task.getId(), update(to)).status())
                    .isEqualTo(to);
        } else {
            assertThatThrownBy(() -> service.update(alice.getId(), project.getId(), task.getId(), update(to)))
                    .isInstanceOfSatisfying(ApiException.class,
                            e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
        }
    }

    @Test
    void aStatusChangeIsRecordedButAPlainEditIsNot() {
        aliceIsAMember();
        Task task = existing(TaskStatus.A_FAIRE);

        service.update(alice.getId(), project.getId(), task.getId(), update(TaskStatus.A_FAIRE));
        assertThat(task.getStatusHistory()).isEmpty();

        service.update(alice.getId(), project.getId(), task.getId(), update(TaskStatus.EN_COURS));
        assertThat(task.getStatusHistory()).singleElement().satisfies(change -> {
            assertThat(change.getFromStatus()).isEqualTo(TaskStatus.A_FAIRE);
            assertThat(change.getToStatus()).isEqualTo(TaskStatus.EN_COURS);
        });
    }

    @Test
    void aTaskCannotBeFinishedWithOpenSubtasks() {
        aliceIsAMember();
        Task task = existing(TaskStatus.EN_COURS);
        Fixtures.subtask(task, "Relire", true);
        Fixtures.subtask(task, "Valider", false);

        assertThatThrownBy(() -> service.update(alice.getId(), project.getId(), task.getId(), update(TaskStatus.TERMINE)))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getMessage()).contains("sous-tâches"));
        assertThat(task.getStatus()).isEqualTo(TaskStatus.EN_COURS);
    }

    @Test
    void aTaskOfAnotherProjectIsNotFound() {
        aliceIsAMember();
        Task foreign = Fixtures.task(Fixtures.project("Autre", alice), "Ailleurs", TaskStatus.A_FAIRE);
        when(taskRepository.findById(foreign.getId())).thenReturn(Optional.of(foreign));

        assertThatThrownBy(() -> service.archive(alice.getId(), project.getId(), foreign.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }

    @Test
    void archiveAndRestoreFlipTheFlag() {
        aliceIsAMember();
        Task task = existing(TaskStatus.A_FAIRE);

        assertThat(service.archive(alice.getId(), project.getId(), task.getId()).archived()).isTrue();
        assertThat(service.restore(alice.getId(), project.getId(), task.getId()).archived()).isFalse();
    }

    @Test
    void onlyAnArchivedTaskCanBeDeleted() {
        aliceIsAMember();
        Task task = existing(TaskStatus.A_FAIRE);

        assertThatThrownBy(() -> service.delete(alice.getId(), project.getId(), task.getId()))
                .isInstanceOf(ApiException.class);
        verify(taskRepository, never()).delete(any());

        task.setArchived(true);
        service.delete(alice.getId(), project.getId(), task.getId());
        verify(taskRepository).delete(task);
    }

    @Test
    void unassignMemberClearsTheirTasksInThatProjectOnly() {
        service.unassignMember(project.getId(), alice.getId());

        verify(taskRepository).clearAssignee(project.getId(), alice.getId());
    }
}
