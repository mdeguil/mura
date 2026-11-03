package io.mura.project;

import io.mura.project.dto.InvitationResponse;
import io.mura.support.ControllerTestSupport;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class InvitationControllerTest extends ControllerTestSupport {

    @Mock
    private InvitationService invitationService;

    private final UUID projectId = UUID.randomUUID();
    private final UUID invitationId = UUID.randomUUID();
    private InvitationResponse invitation;

    @BeforeEach
    void setUp() {
        mount(new InvitationController(invitationService));
        var alice = Fixtures.user("alice");
        ProjectInvitation entity = new ProjectInvitation();
        entity.setId(invitationId);
        entity.setProject(Fixtures.project("Refonte", alice));
        entity.setInvitedUser(Fixtures.user("bob"));
        entity.setInvitedBy(alice);
        entity.setStatus(InvitationStatus.PENDING);
        entity.setCreatedAt(Instant.parse("2026-03-01T00:00:00Z"));
        invitation = InvitationResponse.from(entity, Instant.parse("2026-03-15T00:00:00Z"));
    }

    @Test
    void invitingAnswers201AndNeedsAValidAddress() throws Exception {
        mvc.perform(withJson(post("/api/projects/{id}/invitations", projectId), Map.of("email", "pas-un-email")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("email"));
        verifyNoInteractions(invitationService);

        when(invitationService.invite(eq(ME), eq(projectId), any())).thenReturn(invitation);
        mvc.perform(withJson(post("/api/projects/{id}/invitations", projectId), Map.of("email", "bob@mura.test")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    void theProjectsListAndMineAreSeparate() throws Exception {
        when(invitationService.listOpenForProject(ME, projectId)).thenReturn(List.of(invitation));
        when(invitationService.listPendingForUser(ME)).thenReturn(List.of());

        mvc.perform(get("/api/projects/{id}/invitations", projectId)).andExpect(jsonPath("$[0].projectName").value("Refonte"));
        mvc.perform(get("/api/invitations")).andExpect(status().isOk());
    }

    @Test
    void answeringReadingAndCancelling() throws Exception {
        when(invitationService.accept(ME, invitationId)).thenReturn(invitation);
        when(invitationService.decline(ME, invitationId)).thenReturn(invitation);
        when(invitationService.markRead(ME, invitationId)).thenReturn(invitation);
        when(invitationService.dismiss(ME, invitationId)).thenReturn(invitation);

        for (String action : new String[]{"accept", "decline", "read", "dismiss"}) {
            mvc.perform(post("/api/invitations/{id}/" + action, invitationId)).andExpect(status().isOk());
        }
        mvc.perform(delete("/api/projects/{p}/invitations/{i}", projectId, invitationId)).andExpect(status().isNoContent());
        verify(invitationService).cancel(ME, projectId, invitationId);
    }
}
