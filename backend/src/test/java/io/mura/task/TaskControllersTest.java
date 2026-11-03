package io.mura.task;

import io.mura.common.exception.ApiException;
import io.mura.support.ControllerTestSupport;
import io.mura.support.Fixtures;
import io.mura.task.dto.SubtaskResponse;
import io.mura.task.dto.TaskResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class TaskControllersTest {

    private static final UUID PROJECT = UUID.randomUUID();
    private static final UUID TASK = UUID.randomUUID();

    private static TaskResponse aTask() {
        return TaskResponse.from(Fixtures.task(Fixtures.project("Refonte", Fixtures.user("alice")), "Maquettes", TaskStatus.A_FAIRE));
    }

    @Nested
    @ExtendWith(MockitoExtension.class)
    class Tasks extends ControllerTestSupport {

        @Mock
        private TaskService taskService;

        @BeforeEach
        void setUp() {
            mount(new TaskController(taskService));
        }

        @Test
        void bothListsAnswerForTheCaller() throws Exception {
            when(taskService.listForProject(ME, PROJECT)).thenReturn(List.of(aTask()));
            when(taskService.listArchivedForProject(ME, PROJECT)).thenReturn(List.of());

            mvc.perform(get("/api/projects/{p}/tasks", PROJECT)).andExpect(jsonPath("$[0].name").value("Maquettes"));
            mvc.perform(get("/api/projects/{p}/tasks/archived", PROJECT)).andExpect(status().isOk());
        }

        @Test
        void aTaskNeedsANameAndBothDates() throws Exception {
            mvc.perform(withJson(post("/api/projects/{p}/tasks", PROJECT), Map.of("name", "Maquettes", "startDate", "2026-03-01")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.field").value("endDate"));
            verifyNoInteractions(taskService);
        }

        @Test
        void creatingAnswers201() throws Exception {
            when(taskService.create(eq(ME), eq(PROJECT), any())).thenReturn(aTask());

            mvc.perform(withJson(post("/api/projects/{p}/tasks", PROJECT),
                            Map.of("name", "Maquettes", "startDate", "2026-03-01", "endDate", "2026-03-10")))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.status").value("A_FAIRE"));
        }

        @Test
        void aRefusedStatusChangeIsAConflict() throws Exception {
            when(taskService.update(eq(ME), eq(PROJECT), eq(TASK), any()))
                    .thenThrow(new ApiException(HttpStatus.CONFLICT, "Cette tâche ne peut pas passer à ce statut."));

            mvc.perform(withJson(put("/api/projects/{p}/tasks/{t}", PROJECT, TASK),
                            Map.of("name", "Maquettes", "status", "TERMINE", "startDate", "2026-03-01", "endDate", "2026-03-10")))
                    .andExpect(status().isConflict());
        }

        @Test
        void archiveRestoreAndDelete() throws Exception {
            when(taskService.archive(ME, PROJECT, TASK)).thenReturn(aTask());
            when(taskService.restore(ME, PROJECT, TASK)).thenReturn(aTask());

            mvc.perform(patch("/api/projects/{p}/tasks/{t}/archive", PROJECT, TASK)).andExpect(status().isOk());
            mvc.perform(patch("/api/projects/{p}/tasks/{t}/restore", PROJECT, TASK)).andExpect(status().isOk());
            mvc.perform(delete("/api/projects/{p}/tasks/{t}", PROJECT, TASK)).andExpect(status().isNoContent());
            verify(taskService).delete(ME, PROJECT, TASK);
        }
    }

    @Nested
    @ExtendWith(MockitoExtension.class)
    class Subtasks extends ControllerTestSupport {

        @Mock
        private SubtaskService subtaskService;
        private final UUID subtaskId = UUID.randomUUID();

        @BeforeEach
        void setUp() {
            mount(new SubtaskController(subtaskService));
        }

        @Test
        void aSubtaskNeedsAName() throws Exception {
            mvc.perform(withJson(post("/api/projects/{p}/tasks/{t}/subtasks", PROJECT, TASK), Map.of("name", " ")))
                    .andExpect(status().isBadRequest());
            verifyNoInteractions(subtaskService);
        }

        @Test
        void creatingTogglingAndDeleting() throws Exception {
            when(subtaskService.create(eq(ME), eq(PROJECT), eq(TASK), any())).thenReturn(new SubtaskResponse(subtaskId, "Relire", false));
            when(subtaskService.toggle(ME, PROJECT, TASK, subtaskId)).thenReturn(new SubtaskResponse(subtaskId, "Relire", true));

            mvc.perform(withJson(post("/api/projects/{p}/tasks/{t}/subtasks", PROJECT, TASK), Map.of("name", "Relire")))
                    .andExpect(status().isCreated());
            mvc.perform(patch("/api/projects/{p}/tasks/{t}/subtasks/{s}/toggle", PROJECT, TASK, subtaskId))
                    .andExpect(jsonPath("$.done").value(true));
            mvc.perform(delete("/api/projects/{p}/tasks/{t}/subtasks/{s}", PROJECT, TASK, subtaskId))
                    .andExpect(status().isNoContent());
            verify(subtaskService).delete(ME, PROJECT, TASK, subtaskId);
        }
    }
}
