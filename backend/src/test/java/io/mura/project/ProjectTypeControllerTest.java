package io.mura.project;

import io.mura.project.dto.ProjectTypeResponse;
import io.mura.support.ControllerTestSupport;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProjectTypeControllerTest extends ControllerTestSupport {

    @Mock
    private ProjectTypeService projectTypeService;

    @BeforeEach
    void setUp() {
        mount(new ProjectTypeController(projectTypeService));
    }

    @Test
    void everyoneReadsTheTypesWithoutTheirCounts() throws Exception {
        when(projectTypeService.list()).thenReturn(List.of(ProjectTypeResponse.from(Fixtures.type("Web"))));

        mvc.perform(get("/api/project-types"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].label").value("Web"))
                .andExpect(jsonPath("$[0].projectCount").doesNotExist());
    }
}
