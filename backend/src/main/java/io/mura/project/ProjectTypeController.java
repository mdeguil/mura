package io.mura.project;

import io.mura.project.dto.ProjectTypeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * The project types, under {@code /api/project-types}. Readable by anyone
 * signed in: the picker and the filters are built from it. Changing them is
 * an administrator's business, under {@code /api/admin/project-types}.
 */
@RestController
@RequestMapping("/api/project-types")
@RequiredArgsConstructor
public class ProjectTypeController {

    private final ProjectTypeService projectTypeService;

    /**
     * {@code GET /api/project-types}: every type, in the order offered.
     *
     * @return 200 with the types, without their project counts
     */
    @GetMapping
    public ResponseEntity<List<ProjectTypeResponse>> list() {
        return ResponseEntity.ok(projectTypeService.list());
    }
}
