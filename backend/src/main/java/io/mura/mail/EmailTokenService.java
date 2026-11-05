package io.mura.mail;

import io.mura.common.exception.ApiException;
import io.mura.member.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/**
 * Issues and checks the secrets Mura mails: the code that confirms an
 * address and the link that resets a password. Secrets are stored hashed,
 * work once, expire, and are replaced by the next one of their kind.
 */
@Service
@RequiredArgsConstructor
public class EmailTokenService {

    private static final Duration CODE_LIFETIME = Duration.ofMinutes(15);
    private static final Duration LINK_LIFETIME = Duration.ofHours(1);

    private static final int MAX_ATTEMPTS = 5;

    private final EmailTokenRepository tokenRepository;
    private final PasswordEncoder encoder;
    private final SecureRandom random = new SecureRandom();

    /**
     * A token just issued, with the clear-text secret: returned once so it
     * can be mailed, and never recoverable afterwards.
     *
     * @param token the stored token, holding only a hash of the secret
     * @param secret what to put in the mail
     */
    public record Issued(EmailToken token, String secret) {}

    /**
     * Issues a six-digit code to confirm the account's address, valid for
     * 15 minutes. Any earlier code stops working.
     *
     * @param user the account
     * @return the token and the code to mail
     */
    @Transactional
    public Issued issueCode(User user) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        return issue(user, EmailTokenPurpose.EMAIL_VERIFICATION, code, CODE_LIFETIME);
    }

    /**
     * Issues a password-reset link secret, valid for an hour. Any earlier
     * link stops working.
     *
     * @param user the account
     * @return the token and the value to put in the link, as
     *         {@code <token id>.<secret>}
     */
    @Transactional
    public Issued issueResetLink(User user) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String secret = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Issued issued = issue(user, EmailTokenPurpose.PASSWORD_RESET, secret, LINK_LIFETIME);
        return new Issued(issued.token(), issued.token().getId() + "." + secret);
    }

    private Issued issue(User user, EmailTokenPurpose purpose, String secret, Duration lifetime) {
        supersede(user.getId(), purpose);

        EmailToken token = new EmailToken();
        token.setUser(user);
        token.setPurpose(purpose);
        token.setTokenHash(encoder.encode(secret));
        token.setExpiresAt(Instant.now().plus(lifetime));
        tokenRepository.saveAndFlush(token);

        return new Issued(token, secret);
    }

    private void supersede(UUID userId, EmailTokenPurpose purpose) {
        Instant now = Instant.now();
        List<EmailToken> live = tokenRepository.findLiveForUser(userId, purpose);
        live.forEach(token -> token.setConsumedAt(now));
        if (!live.isEmpty()) {
            tokenRepository.flush();
        }
    }

    /**
     * Checks a code against the account's live one and spends it. A wrong
     * code counts as an attempt; after five, the code is spent and a new
     * one has to be asked for.
     *
     * <p>The refusals are thrown after the attempt has been counted, so the
     * transaction must not roll back on them: otherwise the counter goes
     * back with it and the five tries never run out. A caller that holds the
     * transaction has to keep it on the same terms, as
     * {@link io.mura.auth.AuthService#verifyEmail} does.
     *
     * @param userId the account the code was mailed to
     * @param code the six digits as typed
     * @return the account the code belongs to
     * @throws ApiException 410 if there is no live code, 429 once five
     *         attempts have been made, 400 for a wrong code
     */
    @Transactional(noRollbackFor = ApiException.class)
    public User consumeCode(UUID userId, String code) {
        EmailToken token = tokenRepository
                .findLiveForUser(userId, EmailTokenPurpose.EMAIL_VERIFICATION).stream()
                .filter(t -> t.isLive(Instant.now()))
                .findFirst()
                .orElseThrow(() -> new ApiException(
                        HttpStatus.GONE,
                        "Ce code a expiré. Demandes-en un nouveau."
                ));

        if (token.getAttempts() >= MAX_ATTEMPTS) {
            token.setConsumedAt(Instant.now());
            throw new ApiException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Trop d'essais. Demande un nouveau code."
            );
        }

        if (!encoder.matches(code.trim(), token.getTokenHash())) {
            token.setAttempts(token.getAttempts() + 1);
            int left = MAX_ATTEMPTS - token.getAttempts();
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    left > 0
                            ? "Code incorrect. Il te reste " + left + " essai" + (left > 1 ? "s" : "") + "."
                            : "Code incorrect. Demande un nouveau code."
            );
        }

        token.setConsumedAt(Instant.now());
        return token.getUser();
    }

    /**
     * Checks a reset link and spends it.
     *
     * @param value what the link carried, {@code <token id>.<secret>}
     * @return the account the link belongs to
     * @throws ApiException 410 with the same message for every way a link
     *         can fail -- malformed, unknown, expired, spent or forged -- so
     *         a wrong one tells a stranger nothing
     */
    @Transactional
    public User consumeResetLink(String value) {
        int dot = value == null ? -1 : value.indexOf('.');
        if (dot <= 0) {
            throw invalidLink();
        }

        UUID id;
        try {
            id = UUID.fromString(value.substring(0, dot));
        } catch (IllegalArgumentException e) {
            throw invalidLink();
        }

        EmailToken token = tokenRepository.findWithUser(id)
                .filter(t -> t.getPurpose() == EmailTokenPurpose.PASSWORD_RESET)
                .filter(t -> t.isLive(Instant.now()))
                .orElseThrow(this::invalidLink);

        if (!encoder.matches(value.substring(dot + 1), token.getTokenHash())) {
            throw invalidLink();
        }

        token.setConsumedAt(Instant.now());
        return token.getUser();
    }

    private ApiException invalidLink() {
        return new ApiException(
                HttpStatus.GONE,
                "Ce lien n'est plus valable. Demande un nouvel email."
        );
    }
}
