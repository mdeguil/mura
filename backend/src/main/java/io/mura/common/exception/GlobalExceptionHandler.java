package io.mura.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.lang.reflect.RecordComponent;
import java.util.Comparator;
import java.util.stream.Collectors;

/**
 * Turns every failure into an {@link ErrorResponse}. The caller's mistakes
 * answer 4xx with a message they can act on; only a real fault answers 500,
 * without its details, and is logged.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * A refusal from a service, answered as it was raised.
     *
     * @param ex the refusal
     * @return its status, message and field
     */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex) {
        return ResponseEntity.status(ex.getStatus())
                .body(new ErrorResponse(ex.getMessage(), ex.getField()));
    }

    /**
     * A request body that breaks its validation rules. One error only: a
     * form shows one message at a time, and the field name tells it where
     * to put it. The validator gathers them in no particular order, so the
     * one kept is the field highest up the request record -- the same one
     * every time.
     *
     * @param ex the failed validation
     * @return 400, with the first field's message and name
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        FieldError first = ex.getBindingResult().getFieldErrors().stream()
                .min(Comparator.comparingInt(error -> position(ex.getTarget(), error.getField())))
                .orElse(null);
        String message = first == null ? "Requête invalide." : first.getDefaultMessage();
        String field = first == null ? null : first.getField();
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ErrorResponse(message, field));
    }

    // Where a field is declared in the request record; anything else sorts last.
    private static int position(Object target, String field) {
        if (target != null && target.getClass().isRecord()) {
            RecordComponent[] components = target.getClass().getRecordComponents();
            for (int i = 0; i < components.length; i++) {
                if (components[i].getName().equals(field)) {
                    return i;
                }
            }
        }
        return Integer.MAX_VALUE;
    }

    // The handlers below are for the caller's mistakes, not the server's: without
    // them each would reach handleUnexpected, answer 500 and be logged as a
    // fault.

    /**
     * A path variable that cannot be read as its type, usually an id that
     * is not a UUID.
     *
     * @param ex the failed conversion
     * @return 400, naming the parameter
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("L'adresse contient une valeur invalide (" + ex.getName() + ").", null));
    }

    /**
     * A request body that is not valid JSON, or not of the expected shape.
     *
     * @param ex the parsing failure
     * @return 400
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse("Le contenu de la requête est illisible.", null));
    }

    /**
     * An address no controller answers.
     *
     * @param ex what the dispatcher raised
     * @return 404
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoRoute(NoResourceFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse("Cette adresse n'existe pas.", null));
    }

    /**
     * A method the address does not take, such as DELETE on a list.
     *
     * @param ex the refusal, which knows the methods that do work
     * @return 405, with those methods in the {@code Allow} header
     */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethod(HttpRequestMethodNotSupportedException ex) {
        HttpHeaders headers = new HttpHeaders();
        if (ex.getSupportedHttpMethods() != null) {
            headers.setAllow(ex.getSupportedHttpMethods());
        }
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).headers(headers)
                .body(new ErrorResponse("Cette action n'est pas possible à cette adresse.", null));
    }

    /**
     * A body in a format the route does not read, such as plain text where
     * JSON is expected.
     *
     * @param ex the refusal, which knows the accepted formats
     * @return 415, naming those formats
     */
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMediaType(HttpMediaTypeNotSupportedException ex) {
        String accepted = ex.getSupportedMediaTypes().stream()
                .map(Object::toString)
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(new ErrorResponse("Format de requête non pris en charge (attendu : " + accepted + ").", null));
    }

    /**
     * Anything else: a fault of the server. It is logged with its stack
     * trace, and the caller gets a generic message that gives nothing away.
     *
     * @param ex the unexpected failure
     * @return 500
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Une erreur inattendue est survenue.", null));
    }

    /**
     * The body of every error response.
     *
     * @param message what went wrong, written for the reader, in French
     * @param field the input the message is about; left out of the JSON when
     *        there is none
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErrorResponse(String message, String field) {}
}
