package io.mura.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.mura.member.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.Set;
import java.util.UUID;

/**
 * Issues and checks the signed tokens (JWT, HMAC-SHA) that sign a browser
 * in. A token names its account by id; whether that account may still act
 * is decided by {@link JwtAuthenticationFilter}, not by the token.
 */
@Service
public class JwtService {

    /**
     * The secrets this repository has ever shipped as examples or defaults.
     * Anyone can read them, so anyone could sign a token with them.
     */
    static final Set<String> PUBLISHED_SECRETS = Set.of(
            "change-this-to-a-very-long-random-secret-key",
            "local-dev-secret-please-change-in-production"
    );

    /** HMAC-SHA256 wants a key of at least 256 bits. */
    static final int MIN_SECRET_BYTES = 32;

    private static final String HOW_TO_FIX =
            " Set JWT_SECRET in .env to a random value, for example the output of: openssl rand -base64 48";

    private final SecretKey key;
    private final long expirationMs;

    /**
     * Builds the key once, from configuration. Whoever holds the secret can
     * sign a token for any account, the administrators included, so the
     * backend refuses to start on a secret that is missing, too short, or
     * one of the {@link #PUBLISHED_SECRETS}: an instance left on the example
     * value would be open to anyone who read the repository.
     *
     * @param secret the signing key, from {@code mura.jwt.secret}; at least
     *        {@value #MIN_SECRET_BYTES} bytes for HMAC-SHA256
     * @param expirationMs how long a token stays valid, from
     *        {@code mura.jwt.expiration-ms}
     * @throws IllegalStateException if the secret is missing, published or
     *         too short
     */
    public JwtService(
            @Value("${mura.jwt.secret}") String secret,
            @Value("${mura.jwt.expiration-ms}") long expirationMs
    ) {
        this.key = Keys.hmacShaKeyFor(requireUsableSecret(secret).getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    private static String requireUsableSecret(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET is not set." + HOW_TO_FIX);
        }
        if (PUBLISHED_SECRETS.contains(secret.trim())) {
            throw new IllegalStateException("JWT_SECRET is still the example value from the repository." + HOW_TO_FIX);
        }
        if (secret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET is shorter than " + MIN_SECRET_BYTES + " bytes." + HOW_TO_FIX);
        }
        return secret;
    }

    /**
     * Issues a token for the account, valid for the configured duration.
     *
     * @param user the account to sign in
     * @return the signed token, with the account's id as subject
     */
    public String generateToken(User user) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(user.getId().toString())
                .claim("email", user.getEmail())
                .claim("username", user.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusMillis(expirationMs)))
                .signWith(key)
                .compact();
    }

    /**
     * Reads the account id out of a token.
     *
     * @param token a token for which {@link #isValid} answered true
     * @return the id of the account it was issued to
     * @throws io.jsonwebtoken.JwtException if the token is not valid
     */
    public UUID extractUserId(String token) {
        return UUID.fromString(parseClaims(token).getSubject());
    }

    /**
     * Whether the token was signed with this instance's key and has not
     * expired.
     *
     * @param token the token, without the {@code Bearer } prefix
     * @return true when the token can be trusted
     */
    public boolean isValid(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
