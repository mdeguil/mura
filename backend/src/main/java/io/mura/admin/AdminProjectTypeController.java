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

@RestController
@RequestMapping("/api/admin/project-types")
@RequiredArgsConstructor
public class AdminProjectTypeController {

    private final ProjectTypeService projectTypeService;
    private final AccountService accountService;

    // Listed again here rather than reusing the public endpoint, because
    // this one carries how many projects each type holds -- which is what
    // makes a deletion an informed decision.
    @GetMapping
    public ResponseEntity<List<ProjectTypeResponse>> list(@AuthenticationPrincipal UUID userId) {
        accountService.requireAdmin(userId);
        return ResponseEntity.ok(projectTypeService.listWithCounts());
    }

    @PostMapping
    public ResponseEntity<ProjectTypeResponse> create(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody SaveProjectTypeRequest request
    ) {
        accountService.requireAdmin(userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(projectTypeService.create(request));
    }

    @PutMapping("/{typeId}")
    public ResponseEntity<ProjectTypeResponse> update(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID typeId,
            @Valid @RequestBody SaveProjectTypeRequest request
    ) {
        accountService.requireAdmin(userId);
        return ResponseEntity.ok(projectTypeService.update(typeId, request));
    }

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
