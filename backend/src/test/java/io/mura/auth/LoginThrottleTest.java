package io.mura.auth;

import io.mura.common.exception.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoginThrottleTest {

    private static final String HOME = "203.0.113.7";
    private static final String ELSEWHERE = "198.51.100.4";

    private final MovableClock clock = new MovableClock(Instant.parse("2026-11-05T10:00:00Z"));
    private final LoginThrottle throttle = new LoginThrottle(clock);

    @Test
    void fiveFailuresAtOneAccountHoldTheAddressBack() {
        failAt(HOME, "alice@mura.test", LoginThrottle.MAX_PER_ACCOUNT - 1);
        assertThatCode(() -> throttle.check(HOME, "alice@mura.test")).doesNotThrowAnyException();

        throttle.recordFailure(HOME, "alice@mura.test");

        assertThatThrownBy(() -> throttle.check(HOME, "alice@mura.test"))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.TOO_MANY_REQUESTS))
                .hasMessage("Trop de tentatives de connexion. Réessaie dans 15 minutes.");
    }

    @Test
    void theAccountIsNotLockedForSomeoneElse() {
        failAt(HOME, "alice@mura.test", LoginThrottle.MAX_PER_ACCOUNT);

        assertThatCode(() -> throttle.check(ELSEWHERE, "alice@mura.test")).doesNotThrowAnyException();
    }

    @Test
    void theCaseOfTheAddressDoesNotBuyMoreTries() {
        failAt(HOME, "alice@mura.test", LoginThrottle.MAX_PER_ACCOUNT - 1);
        throttle.recordFailure(HOME, " ALICE@Mura.test ");

        assertThatThrownBy(() -> throttle.check(HOME, "alice@mura.test")).isInstanceOf(ApiException.class);
    }

    @Test
    void spreadingGuessesOverManyAccountsHitsTheAddressLimit() {
        for (int i = 0; i < LoginThrottle.MAX_PER_ADDRESS; i++) {
            throttle.recordFailure(HOME, "person" + i + "@mura.test");
        }

        assertThatThrownBy(() -> throttle.check(HOME, "someone-new@mura.test")).isInstanceOf(ApiException.class);
        assertThatCode(() -> throttle.check(ELSEWHERE, "someone-new@mura.test")).doesNotThrowAnyException();
    }

    @Test
    void theHoldEndsWithTheWindowAndSaysHowLongIsLeft() {
        failAt(HOME, "alice@mura.test", LoginThrottle.MAX_PER_ACCOUNT);

        clock.advance(LoginThrottle.WINDOW.minusSeconds(30));
        assertThatThrownBy(() -> throttle.check(HOME, "alice@mura.test"))
                .hasMessage("Trop de tentatives de connexion. Réessaie dans 1 minute.");

        clock.advance(Duration.ofSeconds(30));
        assertThatCode(() -> throttle.check(HOME, "alice@mura.test")).doesNotThrowAnyException();
    }

    @Test
    void aFailureAfterTheWindowStartsANewCount() {
        failAt(HOME, "alice@mura.test", LoginThrottle.MAX_PER_ACCOUNT - 1);
        clock.advance(LoginThrottle.WINDOW);

        throttle.recordFailure(HOME, "alice@mura.test");

        assertThatCode(() -> throttle.check(HOME, "alice@mura.test")).doesNotThrowAnyException();
    }

    @Test
    void aSuccessForgetsTheFailuresAtThatAccount() {
        failAt(HOME, "alice@mura.test", LoginThrottle.MAX_PER_ACCOUNT - 1);

        throttle.recordSuccess(HOME, "alice@mura.test");
        throttle.recordFailure(HOME, "alice@mura.test");

        assertThatCode(() -> throttle.check(HOME, "alice@mura.test")).doesNotThrowAnyException();
    }

    private void failAt(String address, String email, int times) {
        for (int i = 0; i < times; i++) {
            throttle.recordFailure(address, email);
        }
    }

    private static final class MovableClock extends Clock {

        private Instant now;

        MovableClock(Instant start) {
            this.now = start;
        }

        void advance(Duration by) {
            now = now.plus(by);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }
}
