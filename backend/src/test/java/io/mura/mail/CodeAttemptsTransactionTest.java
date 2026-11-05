package io.mura.mail;

import io.mura.admin.FirstAdministrator;
import io.mura.auth.AuthService;
import io.mura.auth.dto.VerifyEmailRequest;
import io.mura.common.exception.ApiException;
import io.mura.common.security.JwtService;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.support.Fixtures;
import io.mura.support.TransactionProbe;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * A refused verification code has to cost an attempt that stays counted. The
 * refusal is an exception thrown inside the transaction, so these tests run
 * the services behind their real transactional proxy and check that it
 * commits rather than rolls back: a rollback would hand the attempt back and
 * the limit of five would never be reached.
 */
@ExtendWith(MockitoExtension.class)
class CodeAttemptsTransactionTest {

    @Mock
    private EmailTokenRepository tokenRepository;
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

    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private final TransactionProbe probe = new TransactionProbe();
    private User alice;

    @BeforeEach
    void setUp() {
        alice = Fixtures.user("alice");
    }

    private EmailToken liveCode(String code, int attempts) {
        EmailToken token = new EmailToken();
        token.setUser(alice);
        token.setPurpose(EmailTokenPurpose.EMAIL_VERIFICATION);
        token.setTokenHash(encoder.encode(code));
        token.setExpiresAt(Instant.now().plus(Duration.ofMinutes(10)));
        token.setAttempts(attempts);
        return token;
    }

    @Test
    void aWrongCodeCommitsTheAttemptItCost() {
        EmailToken token = liveCode("123456", 0);
        when(tokenRepository.findLiveForUser(alice.getId(), EmailTokenPurpose.EMAIL_VERIFICATION))
                .thenReturn(List.of(token));
        EmailTokenService service = probe.wrap(new EmailTokenService(tokenRepository, encoder));

        assertThatThrownBy(() -> service.consumeCode(alice.getId(), "000000"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST));

        assertThat(token.getAttempts()).isEqualTo(1);
        assertThat(probe.outcomes()).containsExactly("commit");
    }

    @Test
    void theFifthRefusalCommitsTheBurntCode() {
        EmailToken token = liveCode("123456", 5);
        when(tokenRepository.findLiveForUser(alice.getId(), EmailTokenPurpose.EMAIL_VERIFICATION))
                .thenReturn(List.of(token));
        EmailTokenService service = probe.wrap(new EmailTokenService(tokenRepository, encoder));

        assertThatThrownBy(() -> service.consumeCode(alice.getId(), "123456"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));

        assertThat(token.getConsumedAt()).isNotNull();
        assertThat(probe.outcomes()).containsExactly("commit");
    }

    @Test
    void verifyingWithAWrongCodeKeepsTheTransaction() {
        alice.setEmailVerifiedAt(null);
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(emailTokenService.consumeCode(any(), anyString()))
                .thenThrow(new ApiException(HttpStatus.BAD_REQUEST, "Code incorrect."));
        AuthService service = probe.wrap(
                new AuthService(userRepository, passwordEncoder, jwtService, emailTokenService, mailService,
                        new MailThrottle(), new FirstAdministrator(userRepository, "")));

        assertThatThrownBy(() -> service.verifyEmail(alice.getId(), new VerifyEmailRequest("000000")))
                .isInstanceOf(ApiException.class);

        assertThat(alice.isEmailVerified()).isFalse();
        assertThat(probe.outcomes()).containsExactly("commit");
    }
}
