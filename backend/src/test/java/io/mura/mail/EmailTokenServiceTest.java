package io.mura.mail;

import io.mura.common.exception.ApiException;
import io.mura.member.User;
import io.mura.support.Fixtures;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmailTokenServiceTest {

    @Mock
    private EmailTokenRepository tokenRepository;

    // A real encoder at its lowest cost: the point is that what is stored is
    // a hash that the clear secret matches, which a mock would only pretend.
    private final PasswordEncoder encoder = new BCryptPasswordEncoder(4);
    private EmailTokenService service;
    private User alice;

    @BeforeEach
    void setUp() {
        service = new EmailTokenService(tokenRepository, encoder);
        alice = Fixtures.user("alice");
        lenient().when(tokenRepository.saveAndFlush(any(EmailToken.class))).thenAnswer(call -> {
            EmailToken token = call.getArgument(0);
            token.setId(UUID.randomUUID());
            return token;
        });
    }

    private EmailToken liveToken(EmailTokenPurpose purpose, String secret) {
        EmailToken token = new EmailToken();
        token.setId(UUID.randomUUID());
        token.setUser(alice);
        token.setPurpose(purpose);
        token.setTokenHash(encoder.encode(secret));
        token.setExpiresAt(Instant.now().plus(Duration.ofMinutes(10)));
        return token;
    }

    @Test
    void aCodeIsSixDigitsAndOnlyItsHashIsKept() {
        when(tokenRepository.findLiveForUser(alice.getId(), EmailTokenPurpose.EMAIL_VERIFICATION)).thenReturn(List.of());

        EmailTokenService.Issued issued = service.issueCode(alice);

        assertThat(issued.secret()).matches("\\d{6}");
        assertThat(issued.token().getTokenHash()).isNotEqualTo(issued.secret());
        assertThat(encoder.matches(issued.secret(), issued.token().getTokenHash())).isTrue();
        assertThat(issued.token().getExpiresAt()).isBetween(Instant.now().plus(Duration.ofMinutes(14)),
                Instant.now().plus(Duration.ofMinutes(16)));
    }

    @Test
    void issuingANewCodeRetiresTheOldOnes() {
        EmailToken old = liveToken(EmailTokenPurpose.EMAIL_VERIFICATION, "111111");
        when(tokenRepository.findLiveForUser(alice.getId(), EmailTokenPurpose.EMAIL_VERIFICATION)).thenReturn(List.of(old));

        service.issueCode(alice);

        assertThat(old.getConsumedAt()).isNotNull();
        verify(tokenRepository).flush();
    }

    @Test
    void aResetLinkCarriesItsRowIdAndLastsAnHour() {
        when(tokenRepository.findLiveForUser(alice.getId(), EmailTokenPurpose.PASSWORD_RESET)).thenReturn(List.of());

        EmailTokenService.Issued issued = service.issueResetLink(alice);

        assertThat(issued.secret()).startsWith(issued.token().getId() + ".");
        assertThat(issued.token().getExpiresAt()).isAfter(Instant.now().plus(Duration.ofMinutes(59)));
    }

    @Test
    void theRightCodeIsSpentAndReturnsTheAccount() {
        EmailToken token = liveToken(EmailTokenPurpose.EMAIL_VERIFICATION, "123456");
        when(tokenRepository.findLiveForUser(alice.getId(), EmailTokenPurpose.EMAIL_VERIFICATION)).thenReturn(List.of(token));

        assertThat(service.consumeCode(alice.getId(), " 123456 ")).isEqualTo(alice);
        assertThat(token.getConsumedAt()).isNotNull();
    }

    @Test
    void aWrongCodeCountsAnAttemptAndSaysHowManyAreLeft() {
        EmailToken token = liveToken(EmailTokenPurpose.EMAIL_VERIFICATION, "123456");
        when(tokenRepository.findLiveForUser(alice.getId(), EmailTokenPurpose.EMAIL_VERIFICATION)).thenReturn(List.of(token));

        assertThatThrownBy(() -> service.consumeCode(alice.getId(), "000000"))
                .isInstanceOfSatisfying(ApiException.class, e -> {
                    assertThat(e.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    assertThat(e.getMessage()).contains("4 essais");
                });
        assertThat(token.getAttempts()).isEqualTo(1);
        assertThat(token.getConsumedAt()).isNull();
    }

    @Test
    void afterFiveAttemptsTheCodeIsBurnt() {
        EmailToken token = liveToken(EmailTokenPurpose.EMAIL_VERIFICATION, "123456");
        token.setAttempts(5);
        when(tokenRepository.findLiveForUser(alice.getId(), EmailTokenPurpose.EMAIL_VERIFICATION)).thenReturn(List.of(token));

        assertThatThrownBy(() -> service.consumeCode(alice.getId(), "123456"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS));
        assertThat(token.getConsumedAt()).isNotNull();
    }

    @Test
    void anExpiredCodeIsGone() {
        EmailToken token = liveToken(EmailTokenPurpose.EMAIL_VERIFICATION, "123456");
        token.setExpiresAt(Instant.now().minusSeconds(1));
        when(tokenRepository.findLiveForUser(alice.getId(), EmailTokenPurpose.EMAIL_VERIFICATION)).thenReturn(List.of(token));

        assertThatThrownBy(() -> service.consumeCode(alice.getId(), "123456"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.GONE));
    }

    @Test
    void aGoodResetLinkIsSpentAndReturnsTheAccount() {
        EmailToken token = liveToken(EmailTokenPurpose.PASSWORD_RESET, "s3cret");
        when(tokenRepository.findWithUser(token.getId())).thenReturn(Optional.of(token));

        assertThat(service.consumeResetLink(token.getId() + ".s3cret")).isEqualTo(alice);
        assertThat(token.getConsumedAt()).isNotNull();
    }

    @Test
    void everyBrokenLinkFailsWithTheSameMessage() {
        EmailToken token = liveToken(EmailTokenPurpose.PASSWORD_RESET, "s3cret");
        lenient().when(tokenRepository.findWithUser(token.getId())).thenReturn(Optional.of(token));
        EmailToken code = liveToken(EmailTokenPurpose.EMAIL_VERIFICATION, "s3cret");
        lenient().when(tokenRepository.findWithUser(code.getId())).thenReturn(Optional.of(code));

        for (String link : new String[]{null, "", "sans-point", ".s3cret", "pas-un-uuid.s3cret",
                token.getId() + ".mauvais", code.getId() + ".s3cret"}) {
            assertThatThrownBy(() -> service.consumeResetLink(link))
                    .as("lien « %s »", link)
                    .isInstanceOfSatisfying(ApiException.class, e -> {
                        assertThat(e.getStatus()).isEqualTo(HttpStatus.GONE);
                        assertThat(e.getMessage()).isEqualTo("Ce lien n'est plus valable. Demande un nouvel email.");
                    });
        }
        assertThat(token.getConsumedAt()).isNull();
    }
}
