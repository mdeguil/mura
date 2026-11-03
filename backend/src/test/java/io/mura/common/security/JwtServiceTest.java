package io.mura.common.security;

import io.mura.member.User;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private static final String SECRET = "a-test-secret-that-is-long-enough-for-hs256";

    private final JwtService service = new JwtService(SECRET, 60_000);
    private final User alice = Fixtures.user("alice");

    @Test
    void aTokenCarriesTheAccountItWasIssuedFor() {
        String token = service.generateToken(alice);

        assertThat(service.isValid(token)).isTrue();
        assertThat(service.extractUserId(token)).isEqualTo(alice.getId());
    }

    @Test
    void anExpiredTokenIsNoLongerValid() {
        JwtService instant = new JwtService(SECRET, -1_000);

        assertThat(instant.isValid(instant.generateToken(alice))).isFalse();
    }

    @Test
    void aTokenSignedWithAnotherKeyIsRefused() {
        JwtService other = new JwtService("another-secret-just-as-long-as-the-first-one", 60_000);

        assertThat(service.isValid(other.generateToken(alice))).isFalse();
    }

    @Test
    void aTamperedOrMalformedTokenIsRefused() {
        String token = service.generateToken(alice);
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("A") ? "BB" : "AA");

        assertThat(service.isValid(tampered)).isFalse();
        assertThat(service.isValid("pas-un-jeton")).isFalse();
        assertThat(service.isValid("")).isFalse();
    }
}
