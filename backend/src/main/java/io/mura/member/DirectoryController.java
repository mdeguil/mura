package io.mura.member;

import io.mura.member.dto.AddContactRequest;
import io.mura.member.dto.KnownUserResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/directory")
@RequiredArgsConstructor
public class DirectoryController {

    private final DirectoryService directoryService;

    @GetMapping
    public ResponseEntity<List<KnownUserResponse>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(directoryService.listKnownTo(userId));
    }

    @PostMapping
    public ResponseEntity<KnownUserResponse> add(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody AddContactRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(directoryService.addContact(userId, request));
    }

    @DeleteMapping("/{personId}")
    public ResponseEntity<Void> remove(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID personId
    ) {
        directoryService.removeContact(userId, personId);
        return ResponseEntity.noContent().build();
    }
}
