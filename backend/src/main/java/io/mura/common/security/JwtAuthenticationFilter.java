package io.mura.common.security;

import io.mura.member.User;
import io.mura.member.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Reads the {@code Authorization: Bearer} token of each request and, when
 * it is valid, signs the request in as its account. The account is read
 * again from the database every time, so a suspension or a deletion takes
 * effect on the next request rather than when the token expires. The
 * authenticated principal is the account's id ({@link UUID}).
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    // What an account may still reach before its address is confirmed:
    // reading itself, sending the code back, and asking for another one.
    // Everything else waits.
    private static final Set<String> ALLOWED_WHILE_UNVERIFIED = Set.of(
            "/api/auth/me",
            "/api/auth/verify",
            "/api/auth/verify/resend"
    );

    private final JwtService jwtService;
    private final UserRepository userRepository;

    /**
     * Signs the request in when its token is valid and its account may use
     * it: not suspended, and with a confirmed address unless the route is
     * one of the few an unconfirmed account may reach. Otherwise the request
     * goes on unauthenticated, and a protected route answers 401.
     *
     * @param request the incoming request
     * @param response the response, untouched here
     * @param filterChain the rest of the chain
     * @throws ServletException if a later filter fails
     * @throws IOException if a later filter fails
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtService.isValid(token)) {
                UUID userId = jwtService.extractUserId(token);
                // Checked against the database on every request rather than
                // read from a claim in the token. A suspension has to bite
                // now: a role or a status carried inside the token would
                // stay true until it expires, which is a day of access
                // somebody already decided to take away.
                User user = userRepository.findById(userId).orElse(null);

                if (user != null && !user.isSuspended() && mayReach(user, request)) {
                    var authentication = new UsernamePasswordAuthenticationToken(userId, null, List.of());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    // Leaving the request unauthenticated rather than letting it through:
    // the endpoint then answers 401, which the client already knows means
    // "this token cannot do that" -- and it reads /auth/me to find out why.
    private boolean mayReach(User user, HttpServletRequest request) {
        return user.isEmailVerified() || ALLOWED_WHILE_UNVERIFIED.contains(request.getRequestURI());
    }
}
