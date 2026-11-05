package io.mura.common.security;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Counts events per key over a fixed window, the building block of the
 * limits on signing in and on sending mail. A key's window opens with its
 * first event and lasts {@code window}; the next event after that opens a
 * new one from zero.
 *
 * <p>The counts live in memory: they reset when the backend restarts, and
 * an instance running several backends counts on each. Both are acceptable
 * for a self-hosted install, which runs one.
 */
public final class WindowCounter {

    /** Past this many tracked keys, expired ones are swept on the next event. */
    private static final int SWEEP_ABOVE = 10_000;

    private final Clock clock;
    private final Duration window;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    /**
     * A counter whose windows last {@code window}.
     *
     * @param clock where "now" comes from
     * @param window how long a window lasts, from its first event
     */
    public WindowCounter(Clock clock, Duration window) {
        this.clock = clock;
        this.window = window;
    }

    /**
     * When the key may act again, if it has used up its events.
     *
     * @param key what is being counted, for example an IP address
     * @param max how many events a window allows
     * @return the end of the current window when it already holds
     *         {@code max} events, or null while the key is under the limit
     */
    public Instant heldUntil(String key, int max) {
        Instant now = clock.instant();
        Window w = windows.get(key);
        if (w == null || w.expired(now, window) || w.count() < max) {
            return null;
        }
        return w.start().plus(window);
    }

    /**
     * Counts one event for the key.
     *
     * @param key what is being counted
     */
    public void hit(String key) {
        Instant now = clock.instant();
        if (windows.size() > SWEEP_ABOVE) {
            windows.values().removeIf(w -> w.expired(now, window));
        }
        windows.merge(key, new Window(now, 1),
                (old, one) -> old.expired(now, window) ? one : new Window(old.start(), old.count() + 1));
    }

    /**
     * Forgets the key's events, as if its window had ended.
     *
     * @param key what is being counted
     */
    public void forget(String key) {
        windows.remove(key);
    }

    /**
     * The end of a refusal message: when to try again, in whole minutes,
     * rounded up and never less than one.
     *
     * @param until when the key may act again, from {@link #heldUntil}
     * @return for example {@code "Réessaie dans 15 minutes."}
     */
    public String retryIn(Instant until) {
        long seconds = Duration.between(clock.instant(), until).toSeconds();
        long minutes = Math.max(1, (seconds + 59) / 60);
        return "Réessaie dans " + minutes + (minutes == 1 ? " minute." : " minutes.");
    }

    /**
     * The events of one window.
     *
     * @param start when the first event of the window happened
     * @param count how many events since then
     */
    private record Window(Instant start, int count) {

        boolean expired(Instant now, Duration window) {
            return !now.isBefore(start.plus(window));
        }
    }
}
