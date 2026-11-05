package io.mura.mail;

import io.mura.common.exception.ApiException;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class MailThrottleTest {

    private final MovableClock clock = new MovableClock(Instant.parse("2026-11-05T10:00:00Z"));
    private final MailThrottle throttle = new MailThrottle(clock);

    @Test
    void anInboxReceivesFiveMailsAnHourWhoeverAsks() {
        for (int i = 0; i < MailThrottle.MAX_PER_RECIPIENT; i++) {
            assertThat(throttle.trySend("alice@mura.test")).isTrue();
        }

        assertThat(throttle.trySend("alice@mura.test")).isFalse();
        assertThat(throttle.trySend("bob@mura.test")).isTrue();

        clock.advance(MailThrottle.WINDOW);
        assertThat(throttle.trySend("alice@mura.test")).isTrue();
    }

    @Test
    void theCaseOfTheAddressBuysNoExtraMail() {
        for (int i = 0; i < MailThrottle.MAX_PER_RECIPIENT; i++) {
            throttle.trySend(i % 2 == 0 ? "alice@mura.test" : " ALICE@Mura.test ");
        }

        assertThat(throttle.trySend("alice@mura.test")).isFalse();
    }

    @Test
    void theRefusalToTheAccountItselfSaysWhenToAskAgain() {
        for (int i = 0; i < MailThrottle.MAX_PER_RECIPIENT; i++) {
            throttle.sendOrRefuse("alice@mura.test");
        }
        clock.advance(Duration.ofMinutes(20));

        assertThatThrownBy(() -> throttle.sendOrRefuse("alice@mura.test"))
                .isInstanceOf(ApiException.class)
                .hasMessage("Trop d'e-mails envoyés à cette adresse. Réessaie dans 40 minutes.");
    }

    @Test
    void oneClientGetsTenRequestsAnHour() {
        for (int i = 0; i < MailThrottle.MAX_PER_CLIENT; i++) {
            throttle.takeRequest("203.0.113.7");
        }

        assertThatThrownBy(() -> throttle.takeRequest("203.0.113.7"))
                .hasMessage("Trop de demandes. Réessaie dans 60 minutes.");
        assertThatCode(() -> throttle.takeRequest("198.51.100.4")).doesNotThrowAnyException();

        clock.advance(MailThrottle.WINDOW);
        assertThatCode(() -> throttle.takeRequest("203.0.113.7")).doesNotThrowAnyException();
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
