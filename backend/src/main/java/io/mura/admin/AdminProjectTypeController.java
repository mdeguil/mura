package io.mura.admin;

import io.mura.project.ProjectTypeService;
import io.mura.project.dto.ProjectTypeResponse;
import io.mura.project.dto.SaveProjectTypeRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * The project types, for administrators, under
 * {@code /api/admin/project-types}. Every route answers 403 to anyone but
 * an administrator; the rules are in {@link ProjectTypeService}.
 */
@RestController
@RequestMapping("/api/admin/project-types")
@RequiredArgsConstructor
public class AdminProjectTypeController {

    private final ProjectTypeService projectTypeService;
    private final AccountService accountService;

    /**
     * {@code GET /api/admin/project-types}: every type with how many projects
     * it holds. Listed again here rather than reusing the public endpoint,
     * because the count is what makes a deletion an informed decision.
     *
     * @param userId the signed-in administrator
     * @return 200 with the types and their counts
     */
    @GetMapping
    public ResponseEntity<List<ProjectTypeResponse>> list(@AuthenticationPrincipal UUID userId) {
        accountService.requireAdmin(userId);
        return ResponseEntity.ok(projectTypeService.listWithCounts());
    }

    /**
     * {@code POST /api/admin/project-types}: creates a type.
     *
     * @param userId the signed-in administrator
     * @param request its label and emoji
     * @return 201 with the type
     * @see ProjectTypeService#create(SaveProjectTypeRequest)
     */
    @PostMapping
    public ResponseEntity<ProjectTypeResponse> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody SaveProjectTypeRequest request
    ) {
        accountService.requireAdmin(userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(projectTypeService.create(request));
    }

    /**
     * {@code PUT /api/admin/project-types/{typeId}}: changes a type's label
     * and emoji.
     *
     * @param userId the signed-in administrator
     * @param typeId the type
     * @param request its new label and emoji
     * @return 200 with the type
     * @see ProjectTypeService#update(UUID, SaveProjectTypeRequest)
     */
    @PutMapping("/{typeId}")
    public ResponseEntity<ProjectTypeResponse> update(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID typeId,
            @Valid @RequestBody SaveProjectTypeRequest request
    ) {
        accountService.requireAdmin(userId);
        return ResponseEntity.ok(projectTypeService.update(typeId, request));
    }

    /**
     * {@code DELETE /api/admin/project-types/{typeId}}: deletes a type,
     * moving its projects to the fallback.
     *
     * @param userId the signed-in administrator
     * @param typeId the type
     * @return 204
     * @see ProjectTypeService#delete(UUID)
     */
    @DeleteMapping("/{typeId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID typeId
    ) {
        accountService.requireAdmin(userId);
        projectTypeService.delete(typeId);
        return ResponseEntity.noContent().build();
    }
}
