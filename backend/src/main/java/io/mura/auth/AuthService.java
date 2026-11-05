package io.mura.auth;

import io.mura.auth.dto.AuthResponse;
import io.mura.auth.dto.LoginRequest;
import io.mura.auth.dto.RegisterRequest;
import io.mura.common.exception.ApiException;
import io.mura.auth.dto.ForgotPasswordRequest;
import io.mura.auth.dto.ResetPasswordRequest;
import io.mura.auth.dto.VerifyEmailRequest;
import io.mura.common.security.JwtService;
import io.mura.mail.EmailTokenService;
import io.mura.mail.MailService;
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
        // Already trimmed, and the email already lowercased, by
        // RegisterRequest's constructor -- so that the validation constraints
        // judged the same strings that get stored.
        String email = request.email();
        String username = request.username();
        String password = request.password();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "Cet email est déjà utilisé.", "email");
        }
        if (userRepository.existsByUsernameIgnoreCase(username)) {
            throw new ApiException(HttpStatus.CONFLICT, "Ce nom d'utilisateur est déjà pris.", "username");
        }
        if (password.equalsIgnoreCase(email) || password.equalsIgnoreCase(username)) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Le mot de passe ne peut pas être ton email ou ton nom d'utilisateur.",
                    "password"
            );
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));

        try {
            userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            // Two people registering the same address at the same moment both
            // pass the checks above; the unique indexes on lower(email) and
            // lower(username) refuse the second, and this turns that refusal
            // into the same message the checks would have given.
            throw new ApiException(
                    HttpStatus.CONFLICT,
                    "Cet email ou ce nom d'utilisateur vient d'être pris. Réessaie.",
                    null
            );
        }

        // Signed in straight away, but the address is still only a claim:
        // every other endpoint refuses this token until the code comes
        // back, so there is nothing to do but the code screen.
        var issued = emailTokenService.issueCode(user);
        mailService.sendVerificationCode(user.getEmail(), user.getUsername(), issued.secret());

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
        return AccountResponse.from(user);
    }

    /**
     * Mails a new code, which replaces the previous one. Does nothing for an
     * address already confirmed.
     *
     * @param userId the signed-in account
     * @throws ApiException 401 if the account no longer exists
     */
    @Transactional
    public void resendCode(UUID userId) {
        User user = requireUser(userId);
        if (user.isEmailVerified()) {
            return;
        }
        var issued = emailTokenService.issueCode(user);
        mailService.sendVerificationCode(user.getEmail(), user.getUsername(), issued.secret());
    }

    /**
     * Mails a reset link, valid for an hour, to the account using the
     * address -- unless it is suspended. Behaves the same way whether or
     * not the address is in use: telling a stranger which addresses have
     * accounts is telling them where to aim.
     *
     * @param request the address
     */
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmailIgnoreCase(request.email())
                .filter(user -> !user.isSuspended())
                .ifPresent(user -> {
                    var issued = emailTokenService.issueResetLink(user);
                    mailService.sendPasswordReset(
                            user.getEmail(), user.getUsername(), issued.secret());
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
                    "Choisis un mot de passe différent de l'ancien.",
                    "password"
            );
        }
        refusePasswordThatGivesItselfAway(request.password(), user);

        user.setPassword(passwordEncoder.encode(request.password()));
        // Reaching the link proves the address works, which is the whole
        // point of the code. Asking for both would be asking twice.
        if (!user.isEmailVerified()) {
            user.setEmailVerifiedAt(Instant.now());
        }
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Ce compte n'existe plus."));
    }

    /**
     * Signs in. An account whose address is not confirmed signs in too; the
     * token then reaches only the verification routes.
     *
     * @param request the address, in any case, and the password
     * @return a new token and the account
     * @throws ApiException 401 for an unknown email or a wrong password,
     *         with the same message for both; 403 for a suspended account
     */
    public AuthResponse login(LoginRequest request) {
        // Case-insensitive, like registration and like every other lookup by
        // email: capitals from a phone keyboard are not a wrong password.
        User user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Email ou mot de passe incorrect.");
        }

        // Said plainly rather than hidden behind the generic message: a
        // suspended account is not a typo, and hunting for one would be a
        // waste of the reader's evening.
        if (user.isSuspended()) {
            throw new ApiException(
                    HttpStatus.FORBIDDEN,
                    "Ce compte a été suspendu. Contacte un administrateur."
            );
        }

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, AccountResponse.from(user));
    }

    // No rule about shape catches this one: anyone who knows the account
    // already knows both of these strings.
    private void refusePasswordThatGivesItselfAway(String password, User user) {
        if (password.equalsIgnoreCase(user.getEmail())
                || password.equalsIgnoreCase(user.getUsername())) {
            throw new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Le mot de passe ne peut pas être ton email ou ton nom d'utilisateur.",
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
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Ce compte n'existe plus."));
        return AccountResponse.from(user);
    }
}
