package io.mura.auth;

import io.mura.common.exception.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Slows down password guessing on sign-in. Failed attempts are counted over
 * a window of {@link #WINDOW}, twice:
 * <ul>
 *   <li>per address and account, so one machine gets
 *       {@value #MAX_PER_ACCOUNT} tries at a given account;</li>
 *   <li>per address alone, so the same machine cannot get around that by
 *       trying one password on many accounts
 *       ({@value #MAX_PER_ADDRESS} failures in all).</li>
 * </ul>
 * Past either limit, sign-in from that address is refused with a 429 until
 * the window that hit the limit ends; the password is not even checked.
 * Counting per address rather than per account alone means a stranger
 * cannot lock someone out of their own account by failing on purpose.
 * Unknown addresses count like known ones, so the limit says nothing about
 * which accounts exist.
 *
 * <p>The counts live in memory: they reset when the backend restarts, and
 * an instance running several backends counts on each. Both are acceptable
 * for a self-hosted install, which runs one.
 */
@Component
public class LoginThrottle {

    /** Failed attempts one address gets at one account per window. */
    static final int MAX_PER_ACCOUNT = 5;

    /** Failed attempts one address gets in all per window. */
    static final int MAX_PER_ADDRESS = 20;

    /** How long failures are remembered, counted from the first one. */
    static final Duration WINDOW = Duration.ofMinutes(15);

    /** Past this many tracked keys, expired ones are swept on the next failure. */
    private static final int SWEEP_ABOVE = 10_000;

    private final Clock clock;
    private final Map<String, Failures> failures = new ConcurrentHashMap<>();

    /** The throttle Spring builds, on the system clock. */
    public LoginThrottle() {
        this(Clock.systemUTC());
    }

    /**
     * A throttle on a given clock, so tests can move time.
     *
     * @param clock where "now" comes from
     */
    LoginThrottle(Clock clock) {
        this.clock = clock;
    }

    /**
     * Refuses the attempt if this address has used up its tries, at this
     * account or in all. Called before the password is checked.
     *
     * @param address the client's IP address
     * @param email the address typed in the sign-in form
     * @throws ApiException 429 while the address is held back, saying in how
     *         many minutes it can try again
     */
    public void check(String address, String email) {
        Instant now = clock.instant();
        Instant until = later(
                blockedUntil(accountKey(address, email), MAX_PER_ACCOUNT, now),
                blockedUntil(addressKey(address), MAX_PER_ADDRESS, now)
        );
        if (until != null) {
            long minutes = Math.max(1, (Duration.between(now, until).toSeconds() + 59) / 60);
            throw new ApiException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Trop de tentatives de connexion. Réessaie dans " + minutes
                            + (minutes == 1 ? " minute." : " minutes.")
            );
        }
    }

    /**
     * Counts a refused password (or an unknown address) against this
     * address, at this account and in all.
     *
     * @param address the client's IP address
     * @param email the address typed in the sign-in form
     */
    public void recordFailure(String address, String email) {
        Instant now = clock.instant();
        if (failures.size() > SWEEP_ABOVE) {
            failures.values().removeIf(f -> f.expired(now));
        }
        failures.merge(accountKey(address, email), Failures.first(now), (old, one) -> old.plusOne(now));
        failures.merge(addressKey(address), Failures.first(now), (old, one) -> old.plusOne(now));
    }

    /**
     * Forgets the failures at this account after a successful sign-in. The
     * address-wide count stays: a machine that guessed one account right
     * has still been guessing.
     *
     * @param address the client's IP address
     * @param email the address typed in the sign-in form
     */
    public void recordSuccess(String address, String email) {
        failures.remove(accountKey(address, email));
    }

    private Instant blockedUntil(String key, int max, Instant now) {
        Failures f = failures.get(key);
        if (f == null || f.expired(now) || f.count() < max) {
            return null;
        }
        return f.start().plus(WINDOW);
    }

    private static Instant later(Instant a, Instant b) {
        if (a == null) {
            return b;
        }
        if (b == null) {
            return a;
        }
        return a.isAfter(b) ? a : b;
    }

    private static String accountKey(String address, String email) {
        String normalised = email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
        return "account|" + address + "|" + normalised;
    }

    private static String addressKey(String address) {
        return "address|" + address;
    }

    /**
     * The failures in one window.
     *
     * @param start when the first failure of the window happened
     * @param count how many failures since then
     */
    private record Failures(Instant start, int count) {

        static Failures first(Instant now) {
            return new Failures(now, 1);
        }

        boolean expired(Instant now) {
            return !now.isBefore(start.plus(WINDOW));
        }

        Failures plusOne(Instant now) {
            return expired(now) ? first(now) : new Failures(start, count + 1);
        }
    }
}
