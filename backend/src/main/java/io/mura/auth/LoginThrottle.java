package io.mura.auth;

import io.mura.common.exception.ApiException;
import io.mura.common.security.WindowCounter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

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
 */
@Component
public class LoginThrottle {

    /** Failed attempts one address gets at one account per window. */
    static final int MAX_PER_ACCOUNT = 5;

    /** Failed attempts one address gets in all per window. */
    static final int MAX_PER_ADDRESS = 20;

    /** How long failures are remembered, counted from the first one. */
    static final Duration WINDOW = Duration.ofMinutes(15);

    private final WindowCounter failures;

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
        this.failures = new WindowCounter(clock, WINDOW);
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
        Instant until = later(
                failures.heldUntil(accountKey(address, email), MAX_PER_ACCOUNT),
                failures.heldUntil(addressKey(address), MAX_PER_ADDRESS)
        );
        if (until != null) {
            throw new ApiException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Trop de tentatives de connexion. " + failures.retryIn(until)
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
        failures.hit(accountKey(address, email));
        failures.hit(addressKey(address));
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
        failures.forget(accountKey(address, email));
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
}
