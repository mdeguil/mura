package io.mura.group;

import io.mura.group.dto.GroupResponse;
import io.mura.support.ControllerTestSupport;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class GroupControllerTest extends ControllerTestSupport {

    @Mock
    private GroupService groupService;

    private final UUID groupId = UUID.randomUUID();
    private final UUID memberId = UUID.randomUUID();
    private GroupResponse group;

    @BeforeEach
    void setUp() {
        mount(new GroupController(groupService));
        group = GroupResponse.from(Fixtures.group("Design", Fixtures.user("alice")), ME, List.of());
    }

    @Test
    void listAndGetAnswerForTheCaller() throws Exception {
        when(groupService.listForUser(ME)).thenReturn(List.of(group));
        when(groupService.get(ME, groupId)).thenReturn(group);

        mvc.perform(get("/api/groups")).andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("Design"));
        mvc.perform(get("/api/groups/{id}", groupId)).andExpect(status().isOk());
    }

    @Test
    void creatingAGroupHereIsReservedToTheAdministration() throws Exception {
        mvc.perform(withJson(post("/api/groups"), Map.of("name", "Sauvage")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Seul un administrateur peut créer un groupe."));
        verifyNoInteractions(groupService);
    }

    @Test
    void renamingNeedsAName() throws Exception {
        mvc.perform(withJson(put("/api/groups/{id}", groupId), Map.of("name", "")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("name"));

        when(groupService.rename(eq(ME), eq(groupId), any())).thenReturn(group);
        mvc.perform(withJson(put("/api/groups/{id}", groupId), Map.of("name", "Design"))).andExpect(status().isOk());
    }

    @Test
    void addingNeedsAValidAddress() throws Exception {
        mvc.perform(withJson(post("/api/groups/{id}/members", groupId), Map.of("email", "pas-un-email")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("email"));
    }

    @Test
    void settingAsideNeedsToSayWhichWay() throws Exception {
        mvc.perform(withJson(put("/api/groups/{g}/members/{m}/hold", groupId, memberId), "{}"))
                .andExpect(status().isBadRequest());

        when(groupService.setMemberHold(ME, groupId, memberId, true)).thenReturn(group);
        mvc.perform(withJson(put("/api/groups/{g}/members/{m}/hold", groupId, memberId), Map.of("onHold", true)))
                .andExpect(status().isOk());
    }

    @Test
    void removingAndDeletingAnswerWithoutContent() throws Exception {
        mvc.perform(delete("/api/groups/{g}/members/{m}", groupId, memberId)).andExpect(status().isNoContent());
        mvc.perform(delete("/api/groups/{g}", groupId)).andExpect(status().isNoContent());

        verify(groupService).removeMember(ME, groupId, memberId);
        verify(groupService).delete(ME, groupId);
    }
}
