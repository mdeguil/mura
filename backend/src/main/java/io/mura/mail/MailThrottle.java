package io.mura.mail;

import io.mura.common.exception.ApiException;
import io.mura.common.security.WindowCounter;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;

/**
 * Keeps Mura from being used to flood an inbox. Anyone can ask for a reset
 * link for any address, and anyone can register with someone else's address
 * and ask for the code again and again; without a limit, each request is a
 * mail to a person who never asked for it. Two counts, over
 * {@link #WINDOW}:
 * <ul>
 *   <li>per recipient: at most {@value #MAX_PER_RECIPIENT} codes and reset
 *       links to one address, whoever asks;</li>
 *   <li>per client: at most {@value #MAX_PER_CLIENT} reset requests from one
 *       IP address, so one machine cannot spread its mails over many
 *       inboxes.</li>
 * </ul>
 * A reset request over the recipient's limit is dropped silently, since its
 * answer must not say whether the address has an account; the client's
 * limit is refused openly, as it says nothing about any account.
 */
@Component
public class MailThrottle {

    /** Codes and reset links one address receives per window. */
    public static final int MAX_PER_RECIPIENT = 5;

    /** Reset requests one IP address may make per window. */
    public static final int MAX_PER_CLIENT = 10;

    /** How long sends are remembered, counted from the first one. */
    public static final Duration WINDOW = Duration.ofHours(1);

    private final WindowCounter sends;

    /** The throttle Spring builds, on the system clock. */
    public MailThrottle() {
        this(Clock.systemUTC());
    }

    /**
     * A throttle on a given clock, so tests can move time.
     *
     * @param clock where "now" comes from
     */
    MailThrottle(Clock clock) {
        this.sends = new WindowCounter(clock, WINDOW);
    }

    /**
     * Counts a mail to this address if it is still under its limit.
     *
     * @param recipient the address the mail would go to
     * @return true if the mail may go, and it has been counted; false if the
     *         address has received enough for now
     */
    public boolean trySend(String recipient) {
        String key = recipientKey(recipient);
        if (sends.heldUntil(key, MAX_PER_RECIPIENT) != null) {
            return false;
        }
        sends.hit(key);
        return true;
    }

    /**
     * Counts a mail to this address, or refuses it openly. For a request
     * made by the account itself, which may know its own limit.
     *
     * @param recipient the address the mail would go to
     * @throws ApiException 429 if the address has received enough for now,
     *         saying in how many minutes to ask again
     */
    public void sendOrRefuse(String recipient) {
        Instant until = sends.heldUntil(recipientKey(recipient), MAX_PER_RECIPIENT);
        if (until != null) {
            throw new ApiException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Trop d'e-mails envoyés à cette adresse. " + sends.retryIn(until)
            );
        }
        sends.hit(recipientKey(recipient));
    }

    /**
     * Counts a reset request from this client, or refuses it.
     *
     * @param client the client's IP address
     * @throws ApiException 429 if the client has asked too often, saying in
     *         how many minutes to ask again
     */
    public void takeRequest(String client) {
        String key = "client|" + client;
        Instant until = sends.heldUntil(key, MAX_PER_CLIENT);
        if (until != null) {
            throw new ApiException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Trop de demandes. " + sends.retryIn(until)
            );
        }
        sends.hit(key);
    }

    private static String recipientKey(String recipient) {
        return "recipient|" + (recipient == null ? "" : recipient.trim().toLowerCase(Locale.ROOT));
    }
}
