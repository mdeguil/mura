package io.mura.task;

import io.mura.common.exception.ApiException;
import io.mura.member.User;
import io.mura.project.Project;
import io.mura.project.ProjectMemberRepository;
import io.mura.project.ProjectRepository;
import io.mura.support.Fixtures;
import io.mura.task.dto.CreateSubtaskRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubtaskServiceTest {

    @Mock
    private SubtaskRepository subtaskRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @InjectMocks
    private SubtaskService service;

    private User alice;
    private Project project;
    private Task task;

    @BeforeEach
    void setUp() {
        alice = Fixtures.user("alice");
        project = Fixtures.project("Refonte", alice);
        task = Fixtures.task(project, "Maquettes", TaskStatus.EN_COURS);
    }

    private void aliceReachesTheTask() {
        when(projectRepository.existsById(project.getId())).thenReturn(true);
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), alice.getId())).thenReturn(true);
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
    }

    @Test
    void createAddsAnOpenSubtaskToTheTask() {
        aliceReachesTheTask();

        var created = service.create(alice.getId(), project.getId(), task.getId(), new CreateSubtaskRequest("Relire"));

        assertThat(created.name()).isEqualTo("Relire");
        assertThat(created.done()).isFalse();
        verify(subtaskRepository).save(any(Subtask.class));
    }

    @Test
    void toggleFlipsDoneBothWays() {
        aliceReachesTheTask();
        Subtask subtask = Fixtures.subtask(task, "Relire", false);
        when(subtaskRepository.findById(subtask.getId())).thenReturn(Optional.of(subtask));

        assertThat(service.toggle(alice.getId(), project.getId(), task.getId(), subtask.getId()).done()).isTrue();
        assertThat(service.toggle(alice.getId(), project.getId(), task.getId(), subtask.getId()).done()).isFalse();
    }

    @Test
    void aSubtaskOfAnotherTaskIsNotFound() {
        aliceReachesTheTask();
        Task other = Fixtures.task(project, "Autre", TaskStatus.A_FAIRE);
        Subtask foreign = Fixtures.subtask(other, "Ailleurs", false);
        when(subtaskRepository.findById(foreign.getId())).thenReturn(Optional.of(foreign));

        assertThatThrownBy(() -> service.delete(alice.getId(), project.getId(), task.getId(), foreign.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(subtaskRepository, never()).delete(any());
    }

    @Test
    void deleteRemovesTheSubtask() {
        aliceReachesTheTask();
        Subtask subtask = Fixtures.subtask(task, "Relire", true);
        when(subtaskRepository.findById(subtask.getId())).thenReturn(Optional.of(subtask));

        service.delete(alice.getId(), project.getId(), task.getId(), subtask.getId());

        verify(subtaskRepository).delete(subtask);
    }

    @Test
    void aNonMemberIsRefused() {
        when(projectRepository.existsById(project.getId())).thenReturn(true);
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), alice.getId())).thenReturn(false);

        assertThatThrownBy(() -> service.create(alice.getId(), project.getId(), task.getId(), new CreateSubtaskRequest("x")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
    }

    @Test
    void anUnknownProjectOrTaskIsNotFound() {
        when(projectRepository.existsById(project.getId())).thenReturn(false);
        assertThatThrownBy(() -> service.create(alice.getId(), project.getId(), task.getId(), new CreateSubtaskRequest("x")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));

        when(projectRepository.existsById(project.getId())).thenReturn(true);
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), alice.getId())).thenReturn(true);
        UUID unknownTask = UUID.randomUUID();
        when(taskRepository.findById(unknownTask)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.create(alice.getId(), project.getId(), unknownTask, new CreateSubtaskRequest("x")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }
}
