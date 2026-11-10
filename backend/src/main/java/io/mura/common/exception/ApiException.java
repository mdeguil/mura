package io.mura.common.exception;

import io.mura.common.i18n.Texts;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * A refusal the caller is meant to read. {@link GlobalExceptionHandler}
 * turns it into a response with this status and a body of
 * {@code { message, field }}; the message is written for the person using
 * the app, in the language of the request (see {@link Texts}), and the
 * interface shows it as it is.
 *
 * <p>The message is given as a key of {@code messages.properties} and
 * translated as soon as the refusal is made, while the request it answers is
 * still the one being handled. A text that is not a key, such as one already
 * filled in with {@link Texts#get}, is kept as it is.
 */
@Getter
public class ApiException extends RuntimeException {

    /** The HTTP status to answer with. */
    private final HttpStatus status;

    /**
     * Which input the message is about, when it is about one. A form that
     * knows the email is the problem can mark the email field, instead of
     * leaving the reader to guess which of four inputs to fix.
     */
    private final String field;

    /**
     * A refusal about the request as a whole.
     *
     * @param status the HTTP status to answer with
     * @param message the key of what to tell the reader
     */
    public ApiException(HttpStatus status, String message) {
        this(status, message, null);
    }

    /**
     * A refusal about one input of a form.
     *
     * @param status the HTTP status to answer with
     * @param message the key of what to tell the reader
     * @param field the name of the input the message is about, as the
     *        request names it, or null
     */
    public ApiException(HttpStatus status, String message, String field) {
        super(Texts.get(message));
        this.status = status;
        this.field = field;
    }
}
