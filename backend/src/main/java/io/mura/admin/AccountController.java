package io.mura.admin;

import io.mura.admin.dto.AccountDeletionPreview;
import io.mura.admin.dto.ChangeAccountRoleRequest;
import io.mura.admin.dto.SuspendAccountRequest;
import io.mura.member.dto.AccountResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    @GetMapping
    public ResponseEntity<List<AccountResponse>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(accountService.list(userId));
    }

    @PutMapping("/{accountId}/role")
    public ResponseEntity<AccountResponse> changeRole(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID accountId,
            @Valid @RequestBody ChangeAccountRoleRequest request
    ) {
        return ResponseEntity.ok(accountService.changeRole(userId, accountId, request));
    }

    @PutMapping("/{accountId}/suspension")
    public ResponseEntity<AccountResponse> setSuspended(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID accountId,
            @Valid @RequestBody SuspendAccountRequest request
    ) {
        return ResponseEntity.ok(accountService.setSuspended(userId, accountId, request.suspended()));
    }

    // Read before the confirmation is shown, so the dialog can name what
    // deletion is about to do rather than warn in the abstract.
    @GetMapping("/{accountId}/deletion-preview")
    public ResponseEntity<AccountDeletionPreview> deletionPreview(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID accountId
    ) {
        return ResponseEntity.ok(accountService.deletionPreview(userId, accountId));
    }

    @DeleteMapping("/{accountId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID accountId
    ) {
        accountService.delete(userId, accountId);
        return ResponseEntity.noContent().build();
    }
}
