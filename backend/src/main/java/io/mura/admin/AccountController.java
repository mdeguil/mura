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

/**
 * The accounts, for administrators, under {@code /api/admin/accounts}.
 * Every route answers 403 to anyone else; the rules are in
 * {@link AccountService}.
 */
@RestController
@RequestMapping("/api/admin/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final AccountService accountService;

    /**
     * {@code GET /api/admin/accounts}: every account on the instance.
     *
     * @param userId the signed-in administrator
     * @return 200 with the accounts, administrators first
     */
    @GetMapping
    public ResponseEntity<List<AccountResponse>> list(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(accountService.list(userId));
    }

    /**
     * {@code PUT /api/admin/accounts/{accountId}/role}: makes an account an
     * administrator, or a plain user again.
     *
     * @param userId the signed-in administrator
     * @param accountId the account
     * @param request the new role
     * @return 200 with the account
     * @see AccountService#changeRole(UUID, UUID, ChangeAccountRoleRequest)
     */
    @PutMapping("/{accountId}/role")
    public ResponseEntity<AccountResponse> changeRole(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID accountId,
            @Valid @RequestBody ChangeAccountRoleRequest request
    ) {
        return ResponseEntity.ok(accountService.changeRole(userId, accountId, request));
    }

    /**
     * {@code PUT /api/admin/accounts/{accountId}/suspension}: suspends an
     * account, or lets it back in.
     *
     * @param userId the signed-in administrator
     * @param accountId the account
     * @param request whether it should be suspended
     * @return 200 with the account
     * @see AccountService#setSuspended(UUID, UUID, boolean)
     */
    @PutMapping("/{accountId}/suspension")
    public ResponseEntity<AccountResponse> setSuspended(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID accountId,
            @Valid @RequestBody SuspendAccountRequest request
    ) {
        return ResponseEntity.ok(accountService.setSuspended(userId, accountId, request.suspended()));
    }

    /**
     * {@code GET /api/admin/accounts/{accountId}/deletion-preview}: what
     * deleting the account would do. Read before the confirmation is shown,
     * so the dialog can name it rather than warn in the abstract.
     *
     * @param userId the signed-in administrator
     * @param accountId the account
     * @return 200 with the consequences
     */
    @GetMapping("/{accountId}/deletion-preview")
    public ResponseEntity<AccountDeletionPreview> deletionPreview(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID accountId
    ) {
        return ResponseEntity.ok(accountService.deletionPreview(userId, accountId));
    }

    /**
     * {@code DELETE /api/admin/accounts/{accountId}}: deletes a suspended
     * account for good.
     *
     * @param userId the signed-in administrator
     * @param accountId the account
     * @return 204
     * @see AccountService#delete(UUID, UUID)
     */
    @DeleteMapping("/{accountId}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UUID userId,
            @PathVariable UUID accountId
    ) {
        accountService.delete(userId, accountId);
        return ResponseEntity.noContent().build();
    }
}
