package io.mura.auth;

import io.mura.admin.FirstAdministrator;
import io.mura.auth.dto.AuthResponse;
import io.mura.auth.dto.LoginRequest;
import io.mura.auth.dto.RegisterRequest;
import io.mura.common.exception.ApiException;
import io.mura.common.i18n.Texts;
import io.mura.auth.dto.ForgotPasswordRequest;
import io.mura.auth.dto.ResetPasswordRequest;
import io.mura.auth.dto.VerifyEmailRequest;
import io.mura.common.security.JwtService;
import io.mura.mail.EmailTokenService;
import io.mura.mail.MailService;
import io.mura.mail.MailThrottle;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.member.dto.AccountResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Registration, sign-in, confirming the address and resetting a forgotten
 * password.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailTokenService emailTokenService;
    private final MailService mailService;
    private final MailThrottle mailThrottle;
    private final FirstAdministrator firstAdministrator;

    /**
     * Creates the account, signs it in and mails a six-digit code. Until the
     * code is entered, the token only reaches the verification routes.
     *
     * @param request the name, address and password, already normalised
     * @return the token and the new, unconfirmed account
     * @throws ApiException 409 if the email or the username is taken, in any
     *         case; 400 if the password is the email or the username
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email();
        String username = request.username();
        String password = request.password();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "error.auth.emailTaken", "email");
        }
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ApiException(HttpStatus.CONFLICT, "error.auth.usernameTaken", "username");
        }
        if (password.equalsIgnoreCase(email) || password.equalsIgnoreCase(username)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "error.auth.passwordGivesAway",
                    "password"
            );
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setLanguage(Texts.code(Texts.current()));

        try {
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "error.auth.justTaken",
                    null
            );
        }

        if (mailThrottle.trySend(user.getEmail())) {
            var issued = emailTokenService.issueCode(user);
            mailService.sendVerificationCode(user.getEmail(), user.getUsername(), issued.secret(), user.getLocale());
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, AccountResponse.from(user));
    }

    /**
     * Confirms the address with the code that was mailed. Does nothing for
     * an address already confirmed.
     *
     * <p>A refused code still commits: the attempt it cost has to stay
     * counted, or the limit of five would never be reached. Nothing else is
     * written before the code is accepted.
     *
     * <p>Once confirmed, the address may make the account the instance's
     * first administrator (see {@link FirstAdministrator}).
     *
     * @param userId the signed-in account
     * @param request the code
     * @return the account, now confirmed
     * @throws ApiException 400 for a wrong code, 429 once five have been
     *         tried, 410 if the code has expired or been replaced; 401 if
     *         the account no longer exists
     */
    @Transactional(noRollbackFor = ApiException.class)
    public AccountResponse verifyEmail(UUID userId, VerifyEmailRequest request) {
        User user = requireUser(userId);
        if (user.isEmailVerified()) {
            return AccountResponse.from(user);
        }

        emailTokenService.consumeCode(userId, request.code());
        user.setEmailVerifiedAt(Instant.now());
        firstAdministrator.promoteIfDesignated(user);
        return AccountResponse.from(user);
    }

    /**
     * Mails a new code, which replaces the previous one. Does nothing for an
     * address already confirmed. The {@link MailThrottle} caps how many
     * codes one address receives: whoever registered may not own it.
     *
     * @param userId the signed-in account
     * @throws ApiException 401 if the account no longer exists; 429 if the
     *         address has received enough mail for now
     */
    @Transactional
    public void resendCode(UUID userId) {
        User user = requireUser(userId);
        if (user.isEmailVerified()) {
            return;
        }
        mailThrottle.sendOrRefuse(user.getEmail());
        var issued = emailTokenService.issueCode(user);
        mailService.sendVerificationCode(user.getEmail(), user.getUsername(), issued.secret(), user.getLocale());
    }

    /**
     * Mails a reset link, valid for an hour, to the account using the
     * address -- unless it is suspended. Behaves the same way whether or
     * not the address is in use: telling a stranger which addresses have
     * accounts is telling them where to aim. For the same reason, an
     * address that has received enough mail for now (see
     * {@link MailThrottle}) is skipped without a word.
     *
     * @param request the address
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmailIgnoreCase(request.email())
                .filter(user -> !user.isSuspended())
                .filter(user -> mailThrottle.trySend(user.getEmail()))
                .ifPresent(user -> {
                    var issued = emailTokenService.issueResetLink(user);
                    mailService.sendPasswordReset(
                            user.getEmail(), user.getUsername(), issued.secret(), user.getLocale());
                });
    }

    /**
     * Sets a new password from the link that was mailed, and spends the
     * link. Also confirms the address if it was not yet.
     *
     * @param request the link's token and the new password
     * @throws ApiException 410 if the link is unknown, expired or used; 400
     *         if the password is the old one, the email or the username
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        User user = emailTokenService.consumeResetLink(request.token());

        if (passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "error.auth.samePassword",
                    "password"
            );
        }
        refusePasswordThatGivesItselfAway(request.password(), user);

        user.setPassword(passwordEncoder.encode(request.password()));
        if (!user.isEmailVerified()) {
            user.setEmailVerifiedAt(Instant.now());
        }
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "error.auth.accountGone"));
    }

    /**
     * Signs in. An account whose address is not confirmed signs in too; the
     * token then reaches only the verification routes. An account that
     * existed before its address was named in {@code MURA_ADMIN_EMAIL}
     * becomes the first administrator here (see {@link FirstAdministrator}).
     * The account takes the language the sign-in page was in: it is the one
     * the person reads Mura in now, and their mails follow it.
     *
     * @param request the address, in any case, and the password
     * @return a new token and the account
     * @throws ApiException 401 for an unknown email or a wrong password,
     *         with the same message for both; 403 for a suspended account
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "error.auth.badCredentials"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "error.auth.badCredentials");
        }

        if (user.isSuspended()) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "error.auth.suspended"
            );
        }

        String language = Texts.code(Texts.current());
        if (!language.equals(user.getLanguage())) {
            user.setLanguage(language);
            userRepository.save(user);
        }

        firstAdministrator.promoteIfDesignated(user);
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, AccountResponse.from(user));
    }

    /**
     * Changes the language the account reads Mura in, when the person
     * switches it on screen: their mails and notifications follow.
     *
     * @param userId the signed-in account
     * @param language {@code fr} or {@code en}
     * @return the account, in its new language
     * @throws ApiException 401 if the account no longer exists
     */
    @Transactional
    public AccountResponse changeLanguage(UUID userId, String language) {
        User user = requireUser(userId);
        user.setLanguage(Texts.code(Texts.language(language)));
        return AccountResponse.from(user);
    }

    private void refusePasswordThatGivesItselfAway(String password, User user) {
        if (password.equalsIgnoreCase(user.getEmail())
                || password.equalsIgnoreCase(user.getUsername())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "error.auth.passwordGivesAway",
                    "password"
            );
        }
    }

    /**
     * The account as it stands. Read from the database, never from the
     * token: a role taken away an hour ago must read as taken away now.
     *
     * @param userId the signed-in account
     * @return the account
     * @throws ApiException 401 if the account no longer exists
     */
    public AccountResponse me(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "error.auth.accountGone"));
        return AccountResponse.from(user);
    }
}
