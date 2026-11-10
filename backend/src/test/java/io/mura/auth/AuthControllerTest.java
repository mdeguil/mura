package io.mura.auth;

import io.mura.admin.AccountService;
import io.mura.auth.dto.AuthResponse;
import io.mura.auth.dto.DataExport;
import io.mura.auth.dto.LoginRequest;
import io.mura.auth.dto.RegisterRequest;
import io.mura.auth.dto.ResetPasswordRequest;
import io.mura.common.exception.ApiException;
import io.mura.mail.MailThrottle;
import io.mura.member.dto.AccountResponse;
import io.mura.support.ControllerTestSupport;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest extends ControllerTestSupport {

    @Mock
    private AuthService authService;
    @Mock
    private DataExportService dataExportService;
    @Mock
    private AccountService accountService;

    private AccountResponse account;

    @BeforeEach
    void setUp() {
        mount(new AuthController(authService, dataExportService, accountService, new LoginThrottle(), new MailThrottle()));
        account = AccountResponse.from(Fixtures.user("alice"));
    }

    @Test
    void registeringAnswers201WithATokenAndTheAccount() throws Exception {
        when(authService.register(any(RegisterRequest.class))).thenReturn(new AuthResponse("jwt", account));

        mvc.perform(withJson(post("/api/auth/register"),
                        Map.of("username", "alice", "email", "alice@mura.test", "password", "Secret-123!")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("jwt"))
                .andExpect(jsonPath("$.user.username").value("alice"));
    }

    @Test
    void registrationRulesAreCheckedBeforeTheService() throws Exception {
        mvc.perform(withJson(post("/api/auth/register"),
                        Map.of("username", "a b", "email", "alice@mura.test", "password", "x")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("username"));
        mvc.perform(withJson(post("/api/auth/register"),
                        Map.of("username", "alice", "email", "pas-un-email", "password", "x")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("email"));
        verifyNoInteractions(authService);
    }

    @Test
    void aFailedLoginIs401WithItsMessage() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new ApiException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect."));

        mvc.perform(withJson(post("/api/auth/login"), Map.of("email", "alice@mura.test", "password", "faux")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email ou mot de passe incorrect."));
    }

    @Test
    void theSixthWrongPasswordIsRefusedWithoutReachingTheService() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new ApiException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect."));
        Map<String, String> wrong = Map.of("email", "alice@mura.test", "password", "faux");

        for (int i = 0; i < LoginThrottle.MAX_PER_ACCOUNT; i++) {
            mvc.perform(withJson(post("/api/auth/login"), wrong)).andExpect(status().isUnauthorized());
        }
        mvc.perform(withJson(post("/api/auth/login"), wrong))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value(containsString("Trop de tentatives")));

        verify(authService, times(LoginThrottle.MAX_PER_ACCOUNT)).login(any(LoginRequest.class));
    }

    @Test
    void aSuspendedAccountDoesNotCountAsAFailedAttempt() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new ApiException(HttpStatus.FORBIDDEN, "Ce compte a été suspendu."));
        Map<String, String> right = Map.of("email", "alice@mura.test", "password", "Secret-123!");

        for (int i = 0; i <= LoginThrottle.MAX_PER_ACCOUNT; i++) {
            mvc.perform(withJson(post("/api/auth/login"), right)).andExpect(status().isForbidden());
        }
    }

    @Test
    void meAnswersForTheAuthenticatedAccount() throws Exception {
        when(authService.me(ME)).thenReturn(account);

        mvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accountRole").value("USER"));
    }

    @Test
    void theVerificationCodeIsSixDigits() throws Exception {
        mvc.perform(withJson(post("/api/auth/verify"), Map.of("code", "12ab")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Le code fait 6 chiffres."));

        when(authService.verifyEmail(any(), any())).thenReturn(account);
        mvc.perform(withJson(post("/api/auth/verify"), Map.of("code", "123456"))).andExpect(status().isOk());
    }

    @Test
    void refusalsAndValidationAnswerInTheLanguageTheRequestAsksFor() throws Exception {
        mvc.perform(withJson(post("/api/auth/verify"), Map.of("code", "12ab")).header("Accept-Language", "en-GB,en;q=0.9"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("The code is 6 digits."));

        when(authService.login(any(LoginRequest.class)))
                .thenAnswer(invocation -> {
                    throw new ApiException(HttpStatus.UNAUTHORIZED, "error.auth.badCredentials");
                });
        mvc.perform(withJson(post("/api/auth/login"), Map.of("email", "alice@mura.test", "password", "faux"))
                        .header("Accept-Language", "en"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Wrong email or password."));
        mvc.perform(withJson(post("/api/auth/login"), Map.of("email", "alice@mura.test", "password", "faux"))
                        .header("Accept-Language", "de"))
                .andExpect(jsonPath("$.message").value("Email ou mot de passe incorrect."));
    }

    @Test
    void theLanguageIsChangedForTheSignedInAccountOnly() throws Exception {
        when(authService.changeLanguage(ME, "en")).thenReturn(account);

        mvc.perform(withJson(put("/api/auth/me/language"), Map.of("language", "en")))
                .andExpect(status().isOk());
        verify(authService).changeLanguage(ME, "en");

        mvc.perform(withJson(put("/api/auth/me/language"), Map.of("language", "de")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Langue inconnue : choisis fr ou en."));
    }

    @Test
    void oneClientAskingForTooManyResetLinksIsHeldBack() throws Exception {
        for (int i = 0; i < 10; i++) {
            mvc.perform(withJson(post("/api/auth/password/forgot"), Map.of("email", "person" + i + "@mura.test")))
                    .andExpect(status().isNoContent());
        }
        mvc.perform(withJson(post("/api/auth/password/forgot"), Map.of("email", "one-more@mura.test")))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message").value(containsString("Trop de demandes.")));

        verify(authService, times(10)).forgotPassword(any());
    }

    @Test
    void resendForgotAndResetAnswerWithoutContent() throws Exception {
        mvc.perform(post("/api/auth/verify/resend")).andExpect(status().isNoContent());
        mvc.perform(withJson(post("/api/auth/password/forgot"), Map.of("email", "alice@mura.test")))
                .andExpect(status().isNoContent());
        mvc.perform(withJson(post("/api/auth/password/reset"), Map.of("token", "id.secret", "password", "Nouveau-1!")))
                .andExpect(status().isNoContent());

        verify(authService).resendCode(ME);
        verify(authService).resetPassword(new ResetPasswordRequest("id.secret", "Nouveau-1!"));
    }

    @Test
    void theExportIsServedAsAFileToKeep() throws Exception {
        when(dataExportService.export(ME)).thenReturn(new DataExport(Instant.parse("2026-11-03T10:00:00Z"),
                new DataExport.Account(ME, "alice", "alice@mura.test", "USER", null, null, null, "fr"),
                List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of()));

        mvc.perform(get("/api/auth/me/export"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION, containsString("mes-donnees-mura.json")))
                .andExpect(jsonPath("$.account.username").value("alice"));
    }

    @Test
    void closingTheAccountTakesThePassword() throws Exception {
        mvc.perform(withJson(delete("/api/auth/me"), "{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("password"));

        mvc.perform(withJson(delete("/api/auth/me"), Map.of("password", "bon")))
                .andExpect(status().isNoContent());
        verify(accountService).deleteOwn(ME, "bon");
    }

    @Test
    void aWrongPasswordWhenClosingIsReportedOnTheField() throws Exception {
        doThrow(new ApiException(HttpStatus.FORBIDDEN, "Mot de passe incorrect.", "password"))
                .when(accountService).deleteOwn(ME, "faux");

        mvc.perform(withJson(delete("/api/auth/me"), Map.of("password", "faux")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.field").value("password"));
    }
}
