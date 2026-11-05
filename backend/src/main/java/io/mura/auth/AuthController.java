package io.mura.auth;

import io.mura.admin.AccountService;
import io.mura.admin.dto.AccountDeletionPreview;
import io.mura.auth.dto.AuthResponse;
import io.mura.auth.dto.DataExport;
import io.mura.auth.dto.DeleteOwnAccountRequest;
import io.mura.auth.dto.ForgotPasswordRequest;
import io.mura.auth.dto.LoginRequest;
import io.mura.auth.dto.RegisterRequest;
import io.mura.auth.dto.ResetPasswordRequest;
import io.mura.auth.dto.VerifyEmailRequest;
import io.mura.common.exception.ApiException;
import io.mura.member.dto.AccountResponse;
import jakarta.servlet.http.HttpServletRequest;
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

/**
 * The account itself, under {@code /api/auth}: registering, signing in,
 * confirming the address, resetting the password, and the person's own
 * data. Registration, sign-in and the two password routes are open to
 * anyone; the rest act on the signed-in account.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final DataExportService dataExportService;
    private final AccountService accountService;
    private final LoginThrottle loginThrottle;

    /**
     * {@code POST /api/auth/register}: creates an account and signs it in.
     *
     * @param request the new account's name, address and password
     * @return 201 with the token and the account
     * @see AuthService#register(RegisterRequest)
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    /**
     * {@code POST /api/auth/login}: signs in. The {@link LoginThrottle}
     * answers first: an address that has failed too often is refused before
     * the password is looked at. Only a 401 counts as a failure; a suspended
     * account (403) has given the right password.
     *
     * @param request the address and password
     * @param http the request, for the client's IP address (the real one
     *        behind the frontend's proxy, through {@code X-Forwarded-For})
     * @return 200 with the token and the account
     * @throws ApiException 429 while the address is held back
     * @see AuthService#login(LoginRequest)
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest http) {
        String address = http.getRemoteAddr();
        loginThrottle.check(address, request.email());
        try {
            AuthResponse response = authService.login(request);
            loginThrottle.recordSuccess(address, request.email());
            return ResponseEntity.ok(response);
        } catch (ApiException e) {
            if (e.getStatus() == HttpStatus.UNAUTHORIZED) {
                loginThrottle.recordFailure(address, request.email());
            }
            throw e;
        }
    }

    /**
     * {@code GET /api/auth/me}: the account as it stands right now, role and
     * all. The client reads it on load rather than trusting what it stored
     * at sign-in: a role can have been taken away since.
     *
     * @param userId the signed-in account
     * @return 200 with the account
     */
    @GetMapping("/me")
    public ResponseEntity<AccountResponse> me(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(authService.me(userId));
    }

    /**
     * {@code POST /api/auth/verify}: confirms the address with the mailed
     * code. Reachable before the address is confirmed.
     *
     * @param userId the signed-in account
     * @param request the six-digit code
     * @return 200 with the account, now confirmed
     * @see AuthService#verifyEmail(UUID, VerifyEmailRequest)
     */
    @PostMapping("/verify")
    public ResponseEntity<AccountResponse> verify(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody VerifyEmailRequest request
    ) {
        return ResponseEntity.ok(authService.verifyEmail(userId, request));
    }

    /**
     * {@code POST /api/auth/verify/resend}: mails a new code, which replaces
     * the previous one. Reachable before the address is confirmed.
     *
     * @param userId the signed-in account
     * @return 204
     */
    @PostMapping("/verify/resend")
    public ResponseEntity<Void> resend(@AuthenticationPrincipal UUID userId) {
        authService.resendCode(userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code POST /api/auth/password/forgot}: mails a reset link. Always
     * answers the same, whether or not the address has an account: which
     * addresses are registered is not a stranger's business.
     *
     * @param request the address
     * @return 204
     */
    @PostMapping("/password/forgot")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code POST /api/auth/password/reset}: sets a new password from a
     * reset link.
     *
     * @param request the link's token and the new password
     * @return 204
     * @see AuthService#resetPassword(ResetPasswordRequest)
     */
    @PostMapping("/password/reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }

    /**
     * {@code GET /api/auth/me/export}: everything Mura holds about the
     * caller, as a file to keep -- the rights of access and portability
     * (RGPD, art. 15 and 20) without having to ask.
     *
     * @param userId the signed-in account
     * @return 200 with the data, as an attachment named
     *         {@code mes-donnees-mura.json}
     */
    @GetMapping("/me/export")
    public ResponseEntity<DataExport> export(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"mes-donnees-mura.json\"")
                .body(dataExportService.export(userId));
    }

    /**
     * {@code GET /api/auth/me/deletion-preview}: what closing the account
     * will do, shown before it is done.
     *
     * @param userId the signed-in account
     * @return 200 with the projects handed over or deleted, the groups
     *         deleted and the tasks left without assignee
     */
    @GetMapping("/me/deletion-preview")
    public ResponseEntity<AccountDeletionPreview> deletionPreview(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(accountService.ownDeletionPreview(userId));
    }

    /**
     * {@code DELETE /api/auth/me}: the right to erasure (RGPD, art. 17),
     * from the person's own account.
     *
     * @param userId the signed-in account
     * @param request the password, to confirm
     * @return 204
     * @see AccountService#deleteOwn(UUID, String)
     */
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteOwn(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody DeleteOwnAccountRequest request
    ) {
        accountService.deleteOwn(userId, request.password());
        return ResponseEntity.noContent().build();
    }
}
