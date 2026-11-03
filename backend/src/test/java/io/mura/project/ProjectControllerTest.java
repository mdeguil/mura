package io.mura.project;

import io.mura.common.exception.ApiException;
import io.mura.project.dto.MemberResponse;
import io.mura.project.dto.ProjectResponse;
import io.mura.support.ControllerTestSupport;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
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
import static org.mockito.ArgumentMatchers.isNull;
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

@ExtendWith(MockitoExtension.class)
class ProjectControllerTest extends ControllerTestSupport {

    @Mock
    private ProjectService projectService;

    private final UUID projectId = UUID.randomUUID();
    private final UUID memberId = UUID.randomUUID();
    private ProjectResponse project;

    @BeforeEach
    void setUp() {
        mount(new ProjectController(projectService));
        project = ProjectResponse.from(Fixtures.project("Refonte", Fixtures.user("alice")), ProjectAccess.MEMBER, List.of());
    }

    @Test
    void listReturnsTheCallersProjects() throws Exception {
        when(projectService.listForUser(ME)).thenReturn(List.of(project));

        mvc.perform(get("/api/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Refonte"));
    }

    @Test
    void creatingAnswers201() throws Exception {
        when(projectService.create(eq(ME), any())).thenReturn(project);

        mvc.perform(withJson(post("/api/projects"), Map.of("name", "Refonte", "typeId", UUID.randomUUID())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.access").value("MEMBER"));
    }

    @Test
    void aProjectWithoutNameOrTypeIsRefusedBeforeTheService() throws Exception {
        mvc.perform(withJson(post("/api/projects"), Map.of("name", " ", "typeId", UUID.randomUUID())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("name"));
        mvc.perform(withJson(post("/api/projects"), Map.of("name", "Refonte")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("typeId"));
        verifyNoInteractions(projectService);
    }

    @Test
    void aRefusalFromTheServiceKeepsItsStatusAndMessage() throws Exception {
        when(projectService.getForUser(ME, projectId))
                .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "Tu n'as pas accès à ce projet."));

        mvc.perform(get("/api/projects/{id}", projectId))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Tu n'as pas accès à ce projet."));
    }

    @Test
    void archiveRestoreAndDeleteGoToTheService() throws Exception {
        when(projectService.archive(ME, projectId)).thenReturn(project);
        when(projectService.restore(ME, projectId)).thenReturn(project);

        mvc.perform(patch("/api/projects/{id}/archive", projectId)).andExpect(status().isOk());
        mvc.perform(patch("/api/projects/{id}/restore", projectId)).andExpect(status().isOk());
        mvc.perform(delete("/api/projects/{id}", projectId)).andExpect(status().isNoContent());

        verify(projectService).delete(ME, projectId);
    }

    @Test
    void updateCarriesTheBody() throws Exception {
        when(projectService.update(eq(ME), eq(projectId), any())).thenReturn(project);

        mvc.perform(withJson(put("/api/projects/{id}", projectId),
                        Map.of("name", "Refonte", "typeId", UUID.randomUUID(), "status", "EN_COURS")))
                .andExpect(status().isOk());
    }

    @Test
    void aRoleChangeNeedsARole() throws Exception {
        mvc.perform(withJson(patch("/api/projects/{id}/members/{m}/role", projectId, memberId), "{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("role"));

        when(projectService.changeRole(ME, projectId, memberId, ProjectRole.ADMIN))
                .thenReturn(new MemberResponse(memberId, "bob@mura.test", "bob", null, ProjectRole.ADMIN, false));
        mvc.perform(withJson(patch("/api/projects/{id}/members/{m}/role", projectId, memberId), Map.of("role", "ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    void transferAndGroupBringingReturnTheTeam() throws Exception {
        UUID groupId = UUID.randomUUID();
        when(projectService.transferOwnership(ME, projectId, memberId)).thenReturn(List.of());
        when(projectService.addFromGroup(ME, projectId, groupId)).thenReturn(List.of());

        mvc.perform(post("/api/projects/{id}/members/{m}/transfer-ownership", projectId, memberId))
                .andExpect(status().isOk());
        mvc.perform(withJson(post("/api/projects/{id}/members/from-group", projectId), Map.of("groupId", groupId)))
                .andExpect(status().isOk());
        mvc.perform(withJson(post("/api/projects/{id}/members/from-group", projectId), "{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void removingAcceptsAnOptionalMessage() throws Exception {
        mvc.perform(post("/api/projects/{id}/members/{m}/remove", projectId, memberId))
                .andExpect(status().isNoContent());
        verify(projectService).removeMember(eq(ME), eq(projectId), eq(memberId), isNull());

        mvc.perform(withJson(post("/api/projects/{id}/members/{m}/remove", projectId, memberId), Map.of("message", "Merci !")))
                .andExpect(status().isNoContent());
        verify(projectService).removeMember(ME, projectId, memberId, "Merci !");
    }

    @Test
    void aMessageOver500CharactersIsRefused() throws Exception {
        mvc.perform(withJson(post("/api/projects/{id}/members/{m}/remove", projectId, memberId),
                        Map.of("message", "x".repeat(501))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @Disabled("Bug connu, à corriger dans la branche refonte : un identifiant mal formé dans "
            + "l'adresse tombe dans le gestionnaire générique et répond 500 au lieu de 400.")
    void anIdThatIsNotAUuidIsABadRequest() throws Exception {
        mvc.perform(get("/api/projects/{id}", "pas-un-uuid"))
                .andExpect(status().isBadRequest());
    }
}
