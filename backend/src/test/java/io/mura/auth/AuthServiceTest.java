package io.mura.auth;

import io.mura.admin.FirstAdministrator;
import io.mura.auth.dto.AuthResponse;
import io.mura.auth.dto.ForgotPasswordRequest;
import io.mura.auth.dto.LoginRequest;
import io.mura.auth.dto.RegisterRequest;
import io.mura.auth.dto.ResetPasswordRequest;
import io.mura.auth.dto.VerifyEmailRequest;
import io.mura.common.exception.ApiException;
import io.mura.common.security.JwtService;
import io.mura.mail.EmailToken;
import io.mura.mail.EmailTokenService;
import io.mura.mail.MailService;
import io.mura.mail.MailThrottle;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Locale;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtService jwtService;
    @Mock
    private EmailTokenService emailTokenService;
    @Mock
    private MailService mailService;
    @Spy
    private MailThrottle mailThrottle = new MailThrottle();
    @Mock
    private FirstAdministrator firstAdministrator;
    @InjectMocks
    private AuthService service;

    private User alice;

    @BeforeEach
    void setUp() {
        alice = Fixtures.user("alice");
    }

    private RegisterRequest registration(String password) {
        return new RegisterRequest(" alice ", " Alice@Mura.TEST ", password);
    }

    @Test
    void registeringStoresAHashedPasswordAndMailsACode() {
        when(userRepository.existsByEmailIgnoreCase("alice@mura.test")).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCase("alice")).thenReturn(false);
        when(passwordEncoder.encode("Secret-123!")).thenReturn("$hash");
        when(emailTokenService.issueCode(any(User.class))).thenReturn(new EmailTokenService.Issued(new EmailToken(), "042913"));
        when(jwtService.generateToken(any(User.class))).thenReturn("jwt");

        AuthResponse response = service.register(registration("Secret-123!"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).saveAndFlush(saved.capture());
        assertThat(saved.getValue().getEmail()).isEqualTo("alice@mura.test");
        assertThat(saved.getValue().getUsername()).isEqualTo("alice");
        assertThat(saved.getValue().getPassword()).isEqualTo("$hash");
        verify(mailService).sendVerificationCode("alice@mura.test", "alice", "042913", Locale.FRENCH);
        assertThat(response.token()).isEqualTo("jwt");
        assertThat(response.user().emailVerified()).isFalse();
    }

    @Test
    void anAccountReadsMuraInTheLanguageItSignedUpAndSignedInWith() {
        when(userRepository.existsByEmailIgnoreCase("alice@mura.test")).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCase("alice")).thenReturn(false);
        when(passwordEncoder.encode("Secret-123!")).thenReturn("$hash");
        when(emailTokenService.issueCode(any(User.class))).thenReturn(new EmailTokenService.Issued(new EmailToken(), "042913"));
        LocaleContextHolder.setLocale(Locale.ENGLISH);
        try {
            service.register(registration("Secret-123!"));

            ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
            verify(userRepository).saveAndFlush(saved.capture());
            assertThat(saved.getValue().getLanguage()).isEqualTo("en");
            verify(mailService).sendVerificationCode("alice@mura.test", "alice", "042913", Locale.ENGLISH);

            when(userRepository.findByEmailIgnoreCase("alice@mura.test")).thenReturn(Optional.of(alice));
            when(passwordEncoder.matches("Secret-123!", alice.getPassword())).thenReturn(true);
            service.login(new LoginRequest("alice@mura.test", "Secret-123!"));
            assertThat(alice.getLanguage()).isEqualTo("en");
            verify(userRepository).save(alice);
        } finally {
            LocaleContextHolder.resetLocaleContext();
        }
    }

    @Test
    void theLanguageCanBeChangedAndAnythingUnknownMeansFrench() {
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));

        assertThat(service.changeLanguage(alice.getId(), "en").language()).isEqualTo("en");
        assertThat(service.changeLanguage(alice.getId(), "de").language()).isEqualTo("fr");
    }

    @Test
    void aTakenEmailOrUsernameIsRefusedOnItsField() {
        when(userRepository.existsByEmailIgnoreCase("alice@mura.test")).thenReturn(true);
        assertThatThrownBy(() -> service.register(registration("Secret-123!")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getField()).isEqualTo("email"));

        when(userRepository.existsByEmailIgnoreCase("alice@mura.test")).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCase("alice")).thenReturn(true);
        assertThatThrownBy(() -> service.register(registration("Secret-123!")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getField()).isEqualTo("username"));
        verify(userRepository, never()).saveAndFlush(any());
    }

    @Test
    void aPasswordThatIsTheUsernameOrEmailIsRefused() {
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCase(anyString())).thenReturn(false);

        assertThatThrownBy(() -> service.register(registration("ALICE")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getField()).isEqualTo("password"));
    }

    @Test
    void aRaceOnTheUniqueIndexReadsAsAConflict() {
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(userRepository.existsByUsernameIgnoreCase(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$hash");
        when(userRepository.saveAndFlush(any(User.class))).thenThrow(new DataIntegrityViolationException("unique"));

        assertThatThrownBy(() -> service.register(registration("Secret-123!")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.CONFLICT));
        verifyNoInteractions(mailService);
    }

    @Test
    void loginGivesTheSameMessageForAnUnknownEmailAndAWrongPassword() {
        when(userRepository.findByEmailIgnoreCase("nobody@mura.test")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("alice@mura.test")).thenReturn(Optional.of(alice));
        when(passwordEncoder.matches("faux", alice.getPassword())).thenReturn(false);

        String unknown = catchMessage(() -> service.login(new LoginRequest("nobody@mura.test", "x")));
        String wrong = catchMessage(() -> service.login(new LoginRequest("alice@mura.test", "faux")));

        assertThat(unknown).isEqualTo(wrong).isEqualTo("Email ou mot de passe incorrect.");
    }

    @Test
    void aSuspendedAccountIsToldSoAtLogin() {
        Fixtures.suspended(alice);
        when(userRepository.findByEmailIgnoreCase("alice@mura.test")).thenReturn(Optional.of(alice));
        when(passwordEncoder.matches("bon", alice.getPassword())).thenReturn(true);

        assertThatThrownBy(() -> service.login(new LoginRequest("alice@mura.test", "bon")))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.FORBIDDEN));
        verify(jwtService, never()).generateToken(any());
    }

    @Test
    void aGoodLoginReturnsATokenAndTheAccount() {
        when(userRepository.findByEmailIgnoreCase("alice@mura.test")).thenReturn(Optional.of(alice));
        when(passwordEncoder.matches("bon", alice.getPassword())).thenReturn(true);
        when(jwtService.generateToken(alice)).thenReturn("jwt");

        AuthResponse response = service.login(new LoginRequest("alice@mura.test", "bon"));

        assertThat(response.token()).isEqualTo("jwt");
        assertThat(response.user().username()).isEqualTo("alice");
    }

    @Test
    void verifyingSpendsTheCodeAndMarksTheAddress() {
        alice.setEmailVerifiedAt(null);
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));

        assertThat(service.verifyEmail(alice.getId(), new VerifyEmailRequest("123456")).emailVerified()).isTrue();
        verify(emailTokenService).consumeCode(alice.getId(), "123456");
    }

    @Test
    void confirmingTheAddressOrSigningInGivesTheFirstAdministratorAChance() {
        alice.setEmailVerifiedAt(null);
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        service.verifyEmail(alice.getId(), new VerifyEmailRequest("123456"));
        verify(firstAdministrator).promoteIfDesignated(alice);

        when(userRepository.findByEmailIgnoreCase("alice@mura.test")).thenReturn(Optional.of(alice));
        when(passwordEncoder.matches("Secret-123!", alice.getPassword())).thenReturn(true);
        when(jwtService.generateToken(alice)).thenReturn("jwt");
        service.login(new LoginRequest("alice@mura.test", "Secret-123!"));
        verify(firstAdministrator, times(2)).promoteIfDesignated(alice);
    }

    @Test
    void aWrongPasswordNeverReachesTheFirstAdministrator() {
        when(userRepository.findByEmailIgnoreCase("alice@mura.test")).thenReturn(Optional.of(alice));
        when(passwordEncoder.matches("faux", alice.getPassword())).thenReturn(false);

        assertThatThrownBy(() -> service.login(new LoginRequest("alice@mura.test", "faux")))
                .isInstanceOf(ApiException.class);
        verifyNoInteractions(firstAdministrator);
    }

    @Test
    void anAlreadyVerifiedAccountNeedsNoCode() {
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));

        service.verifyEmail(alice.getId(), new VerifyEmailRequest("000000"));
        service.resendCode(alice.getId());

        verifyNoInteractions(emailTokenService, mailService);
    }

    @Test
    void forgotPasswordMailsOnlyAnExistingActiveAccountAndAnswersTheSameEitherWay() {
        User suspended = Fixtures.suspended(Fixtures.user("bob"));
        when(userRepository.findByEmailIgnoreCase("nobody@mura.test")).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("bob@mura.test")).thenReturn(Optional.of(suspended));

        service.forgotPassword(new ForgotPasswordRequest("nobody@mura.test"));
        service.forgotPassword(new ForgotPasswordRequest("bob@mura.test"));
        verifyNoInteractions(mailService);

        when(userRepository.findByEmailIgnoreCase("alice@mura.test")).thenReturn(Optional.of(alice));
        when(emailTokenService.issueResetLink(alice)).thenReturn(new EmailTokenService.Issued(new EmailToken(), "id.secret"));
        service.forgotPassword(new ForgotPasswordRequest("alice@mura.test"));
        verify(mailService).sendPasswordReset("alice@mura.test", "alice", "id.secret", Locale.FRENCH);
    }

    @Test
    void anInboxThatHadEnoughGetsNoMoreResetLinksAndNobodyIsTold() {
        when(userRepository.findByEmailIgnoreCase("alice@mura.test")).thenReturn(Optional.of(alice));
        when(emailTokenService.issueResetLink(alice)).thenReturn(new EmailTokenService.Issued(new EmailToken(), "id.secret"));

        for (int i = 0; i <= MailThrottle.MAX_PER_RECIPIENT; i++) {
            service.forgotPassword(new ForgotPasswordRequest("alice@mura.test"));
        }

        verify(mailService, times(MailThrottle.MAX_PER_RECIPIENT)).sendPasswordReset("alice@mura.test", "alice", "id.secret", Locale.FRENCH);
        verify(emailTokenService, times(MailThrottle.MAX_PER_RECIPIENT)).issueResetLink(alice);
    }

    @Test
    void askingForTheCodeTooOftenIsRefusedOpenly() {
        alice.setEmailVerifiedAt(null);
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(emailTokenService.issueCode(alice)).thenReturn(new EmailTokenService.Issued(new EmailToken(), "042913"));

        for (int i = 0; i < MailThrottle.MAX_PER_RECIPIENT; i++) {
            service.resendCode(alice.getId());
        }

        assertThatThrownBy(() -> service.resendCode(alice.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS))
                .hasMessageStartingWith("Trop d'e-mails envoyés à cette adresse.");
        verify(mailService, times(MailThrottle.MAX_PER_RECIPIENT)).sendVerificationCode("alice@mura.test", "alice", "042913", Locale.FRENCH);
    }

    @Test
    void resettingRefusesTheOldPasswordAndOneThatGivesItselfAway() {
        when(emailTokenService.consumeResetLink("lien")).thenReturn(alice);
        when(passwordEncoder.matches("ancien", alice.getPassword())).thenReturn(true);
        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest("lien", "ancien")))
                .hasMessageContaining("différent de l'ancien");

        when(passwordEncoder.matches("alice@mura.test", alice.getPassword())).thenReturn(false);
        assertThatThrownBy(() -> service.resetPassword(new ResetPasswordRequest("lien", "alice@mura.test")))
                .isInstanceOfSatisfying(ApiException.class, e -> assertThat(e.getField()).isEqualTo("password"));
    }

    @Test
    void resettingStoresTheNewHashAndVerifiesTheAddressOnTheWay() {
        alice.setEmailVerifiedAt(null);
        when(emailTokenService.consumeResetLink("lien")).thenReturn(alice);
        when(passwordEncoder.matches("Nouveau-456!", alice.getPassword())).thenReturn(false);
        when(passwordEncoder.encode("Nouveau-456!")).thenReturn("$new");

        service.resetPassword(new ResetPasswordRequest("lien", "Nouveau-456!"));

        assertThat(alice.getPassword()).isEqualTo("$new");
        assertThat(alice.isEmailVerified()).isTrue();
    }

    @Test
    void meReadsTheAccountFromTheDatabase() {
        when(userRepository.findById(alice.getId())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.me(alice.getId()))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    private static String catchMessage(Runnable call) {
        try {
            call.run();
            return null;
        } catch (ApiException e) {
            return e.getMessage();
        }
    }
}
