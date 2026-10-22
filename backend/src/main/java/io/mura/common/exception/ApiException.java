package io.mura.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;

    // Which input the message is about, when it is about one. A form that
    // knows the email is the problem can mark the email field, instead of
    // leaving the reader to guess which of four inputs to fix.
    private final String field;

    public ApiException(HttpStatus status, String message) {
        this(status, message, null);
    }

    public ApiException(HttpStatus status, String message, String field) {
        super(message);
        this.status = status;
        this.field = field;
    }
}
