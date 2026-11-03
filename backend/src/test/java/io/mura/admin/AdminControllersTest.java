package io.mura.admin;

import io.mura.admin.dto.AdminGroupResponse;
import io.mura.common.exception.ApiException;
import io.mura.member.AccountRole;
import io.mura.member.dto.AccountResponse;
import io.mura.project.ProjectTypeService;
import io.mura.project.dto.ProjectTypeResponse;
import io.mura.support.ControllerTestSupport;
import io.mura.support.Fixtures;
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
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminControllersTest {

    @Nested
    @ExtendWith(MockitoExtension.class)
    class Accounts extends ControllerTestSupport {

        @Mock
        private AccountService accountService;
        private final UUID accountId = UUID.randomUUID();

        @org.junit.jupiter.api.BeforeEach
        void setUp() {
            mount(new AccountController(accountService));
        }

        @Test
        void listAndPreviewGoToTheService() throws Exception {
            when(accountService.list(ME)).thenReturn(List.of(AccountResponse.from(Fixtures.admin("admin"))));

            mvc.perform(get("/api/admin/accounts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].accountRole").value("ADMIN"));
        }

        @Test
        void aRoleChangeAndASuspensionCarryTheirValue() throws Exception {
            when(accountService.changeRole(eq(ME), eq(accountId), any()))
                    .thenReturn(AccountResponse.from(Fixtures.admin("bob")));
            when(accountService.setSuspended(ME, accountId, true))
                    .thenReturn(AccountResponse.from(Fixtures.suspended(Fixtures.user("bob"))));

            mvc.perform(withJson(put("/api/admin/accounts/{id}/role", accountId), Map.of("accountRole", AccountRole.ADMIN)))
                    .andExpect(status().isOk());
            mvc.perform(withJson(put("/api/admin/accounts/{id}/suspension", accountId), Map.of("suspended", true)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.suspended").value(true));
        }

        @Test
        void aSuspensionWithoutItsValueIsRefused() throws Exception {
            mvc.perform(withJson(put("/api/admin/accounts/{id}/suspension", accountId), "{}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.field").value("suspended"));
            verifyNoInteractions(accountService);
        }

        @Test
        void aNonAdministratorIsRefusedWithTheServicesAnswer() throws Exception {
            when(accountService.list(ME)).thenThrow(new ApiException(HttpStatus.FORBIDDEN, "Cette page est réservée aux administrateurs."));

            mvc.perform(get("/api/admin/accounts"))
                    .andExpect(status().isForbidden());
        }

        @Test
        void deletingAnswersWithoutContent() throws Exception {
            mvc.perform(delete("/api/admin/accounts/{id}", accountId)).andExpect(status().isNoContent());
            verify(accountService).delete(ME, accountId);
        }
    }

    @Nested
    @ExtendWith(MockitoExtension.class)
    class Groups extends ControllerTestSupport {

        @Mock
        private AdminGroupService adminGroupService;
        @Mock
        private AccountService accountService;

        @org.junit.jupiter.api.BeforeEach
        void setUp() {
            mount(new AdminGroupController(adminGroupService, accountService));
        }

        @Test
        void everyCallIsCheckedForAnAdministratorFirst() throws Exception {
            doThrow(new ApiException(HttpStatus.FORBIDDEN, "Cette page est réservée aux administrateurs."))
                    .when(accountService).requireAdmin(ME);

            mvc.perform(get("/api/admin/groups")).andExpect(status().isForbidden());
            mvc.perform(delete("/api/admin/groups/{id}", UUID.randomUUID())).andExpect(status().isForbidden());
            verifyNoInteractions(adminGroupService);
        }

        @Test
        void creatingAGroupAnswers201() throws Exception {
            when(adminGroupService.create(eq(ME), any())).thenReturn(
                    AdminGroupResponse.of(Fixtures.group("Design", Fixtures.user("alice")), List.of()));

            mvc.perform(withJson(post("/api/admin/groups"), Map.of("name", "Design", "managerId", UUID.randomUUID())))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.name").value("Design"));
        }

        @Test
        void aGroupNeedsANameAndAGerant() throws Exception {
            mvc.perform(withJson(post("/api/admin/groups"), Map.of("name", "Design")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.field").value("managerId"));
        }
    }

    @Nested
    @ExtendWith(MockitoExtension.class)
    class ProjectTypes extends ControllerTestSupport {

        @Mock
        private ProjectTypeService projectTypeService;
        @Mock
        private AccountService accountService;

        @org.junit.jupiter.api.BeforeEach
        void setUp() {
            mount(new AdminProjectTypeController(projectTypeService, accountService));
        }

        @Test
        void theAdministrationListComesWithCounts() throws Exception {
            when(projectTypeService.listWithCounts()).thenReturn(List.of(ProjectTypeResponse.of(Fixtures.type("Web"), 4L)));

            mvc.perform(get("/api/admin/project-types"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[0].projectCount").value(4));
            verify(accountService).requireAdmin(ME);
        }

        @Test
        void aTypeNeedsALabelAndAnEmoji() throws Exception {
            mvc.perform(withJson(post("/api/admin/project-types"), Map.of("label", "Web")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.field").value("emoji"));
        }

        @Test
        void creatingAnswers201AndDeletingWithoutContent() throws Exception {
            when(projectTypeService.create(any())).thenReturn(ProjectTypeResponse.of(Fixtures.type("Web"), 0L));
            UUID typeId = UUID.randomUUID();

            mvc.perform(withJson(post("/api/admin/project-types"), Map.of("label", "Web", "emoji", "🌐")))
                    .andExpect(status().isCreated());
            mvc.perform(delete("/api/admin/project-types/{id}", typeId)).andExpect(status().isNoContent());
            verify(projectTypeService).delete(typeId);
        }
    }
}
