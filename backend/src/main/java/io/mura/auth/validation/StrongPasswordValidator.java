package io.mura.auth.validation;

import io.mura.common.i18n.Texts;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/** Checks {@link StrongPassword}. */
public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    /** The shortest password accepted. */
    public static final int MIN_LENGTH = 8;

    /**
     * The longest password accepted. 72 is BCrypt's limit, not a policy:
     * beyond it the encoder silently ignores the rest, so a longer password
     * would authenticate on its first 72 characters alone.
     */
    public static final int MAX_LENGTH = 72;

    /**
     * Judges a password, reporting the first rule it breaks in a message of
     * its own rather than reciting the whole rule. An absent or empty
     * password passes: that is {@code @NotBlank}'s business.
     *
     * @param password the password as typed
     * @param context where the message is written
     * @return whether the password meets every rule
     */
    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        if (password == null || password.isEmpty()) {
            return true;
        }

        String problem = firstProblem(password);
        if (problem == null) {
            return true;
        }

        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(problem).addConstraintViolation();
        return false;
    }

    private String firstProblem(String password) {
        if (password.length() < MIN_LENGTH) {
            return Texts.get("validation.password.tooShort", MIN_LENGTH);
        }
        if (password.length() > MAX_LENGTH) {
            return Texts.get("validation.password.tooLong", MAX_LENGTH);
        }
        if (password.chars().noneMatch(Character::isUpperCase)) {
            return Texts.get("validation.password.upper");
        }
        if (password.chars().noneMatch(Character::isLowerCase)) {
            return Texts.get("validation.password.lower");
        }
        if (password.chars().noneMatch(Character::isDigit)) {
            return Texts.get("validation.password.digit");
        }
        if (password.chars().noneMatch(c -> !Character.isLetterOrDigit(c) && !Character.isWhitespace(c))) {
            return Texts.get("validation.password.special");
        }
        return null;
    }
}
