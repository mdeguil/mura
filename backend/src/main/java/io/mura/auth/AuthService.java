package io.mura.auth;

import io.mura.auth.dto.AuthResponse;
import io.mura.auth.dto.LoginRequest;
import io.mura.auth.dto.RegisterRequest;
import io.mura.common.exception.ApiException;
import io.mura.common.security.JwtService;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.member.dto.AccountResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

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
        // The one password rule worth enforcing: anyone who knows the account
        // already knows these two strings.
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

        String token = jwtService.generateToken(user);
        return new AuthResponse(token, AccountResponse.from(user));
    }

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

    // Read from the database, never from the token: a role taken away an
    // hour ago must read as taken away now.
    public AccountResponse me(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Ce compte n'existe plus."));
        return AccountResponse.from(user);
    }
}
