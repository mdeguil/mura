package io.mura.member;

import io.mura.member.dto.KnownUserResponse;
import io.mura.support.ControllerTestSupport;
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
class DirectoryControllerTest extends ControllerTestSupport {

    @Mock
    private DirectoryService directoryService;

    private final UUID personId = UUID.randomUUID();
    private final KnownUserResponse bob =
            new KnownUserResponse(UUID.randomUUID(), "bob", "bob@mura.test", null, List.of(), true, false, false, false);

    @BeforeEach
    void setUp() {
        mount(new DirectoryController(directoryService));
    }

    @Test
    void theCarnetAndTheRequestsAreTheCallers() throws Exception {
        when(directoryService.listKnownTo(ME)).thenReturn(List.of(bob));
        when(directoryService.listRequests(ME)).thenReturn(List.of());

        mvc.perform(get("/api/directory")).andExpect(status().isOk()).andExpect(jsonPath("$[0].username").value("bob"));
        mvc.perform(get("/api/directory/requests")).andExpect(status().isOk());
    }

    @Test
    void askingSomeoneAnswers201AndNeedsAnAddress() throws Exception {
        mvc.perform(withJson(post("/api/directory"), Map.of("email", "")))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(directoryService);

        when(directoryService.addContact(eq(ME), any())).thenReturn(bob);
        mvc.perform(withJson(post("/api/directory"), Map.of("email", "bob@mura.test"))).andExpect(status().isCreated());
    }

    @Test
    void favouritingNeedsToSayWhichWay() throws Exception {
        mvc.perform(withJson(put("/api/directory/{id}/favourite", personId), "{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("favourite"));

        when(directoryService.setFavourite(ME, personId, true)).thenReturn(bob);
        mvc.perform(withJson(put("/api/directory/{id}/favourite", personId), Map.of("favourite", true)))
                .andExpect(status().isOk());
    }

    @Test
    void answeringAndRemovingGoToTheService() throws Exception {
        when(directoryService.accept(ME, personId)).thenReturn(bob);

        mvc.perform(post("/api/directory/requests/{id}/accept", personId)).andExpect(status().isOk());
        mvc.perform(post("/api/directory/requests/{id}/decline", personId)).andExpect(status().isNoContent());
        mvc.perform(delete("/api/directory/{id}", personId)).andExpect(status().isNoContent());

        verify(directoryService).decline(ME, personId);
        verify(directoryService).removeContact(ME, personId);
    }
}
