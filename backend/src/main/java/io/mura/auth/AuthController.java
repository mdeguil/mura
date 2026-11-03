package io.mura.auth;

import io.mura.auth.dto.AuthResponse;
import io.mura.auth.dto.LoginRequest;
import io.mura.auth.dto.ForgotPasswordRequest;
import io.mura.auth.dto.ForgotPasswordRequest;
import io.mura.auth.dto.RegisterRequest;
import io.mura.auth.dto.ResetPasswordRequest;
import io.mura.auth.dto.VerifyEmailRequest;
import io.mura.auth.dto.ResetPasswordRequest;
import io.mura.auth.dto.VerifyEmailRequest;
import io.mura.admin.AccountService;
import io.mura.admin.dto.AccountDeletionPreview;
import io.mura.auth.dto.DataExport;
import io.mura.auth.dto.DeleteOwnAccountRequest;
import io.mura.member.dto.AccountResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final DataExportService dataExportService;
    private final AccountService accountService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    // The account as it stands right now, role and all. The client reads
    // it on load rather than trusting what it stored at sign-in: a role
    // can have been taken away since.
    @GetMapping("/me")
    public ResponseEntity<AccountResponse> me(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(authService.me(userId));
    }

    @PostMapping("/verify")
    public ResponseEntity<AccountResponse> verify(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody VerifyEmailRequest request
    ) {
        return ResponseEntity.ok(authService.verifyEmail(userId, request));
    }

    @PostMapping("/verify/resend")
    public ResponseEntity<Void> resend(@AuthenticationPrincipal UUID userId) {
        authService.resendCode(userId);
        return ResponseEntity.noContent().build();
    }

    // Always answers the same, whether or not the address has an account.
    // Which addresses are registered is not a stranger's business.
    @PostMapping("/password/forgot")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    // Everything Mura holds about the caller, as a file to keep: the rights
    // of access and portability (RGPD, art. 15 and 20) without having to ask.
    @GetMapping("/me/export")
    public ResponseEntity<DataExport> export(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mes-donnees-mura.json\"")
                .body(dataExportService.export(userId));
    }

    // What closing the account will do, shown before it is done.
    @GetMapping("/me/deletion-preview")
    public ResponseEntity<AccountDeletionPreview> deletionPreview(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(accountService.ownDeletionPreview(userId));
    }

    // The right to erasure (RGPD, art. 17), from the person's own account.
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteOwn(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody DeleteOwnAccountRequest request
    ) {
        accountService.deleteOwn(userId, request.password());
        return ResponseEntity.noContent().build();
    }
}
