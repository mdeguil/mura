package io.mura.auth.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * What a password has to be: 8 to 72 characters, with an upper-case
 * letter, a lower-case letter, a digit and a special character. One
 * definition, used by registration and by a reset -- two copies of a rule
 * is one rule and one future mistake. The frontend shows the same rules in
 * {@code utils/passwordRules.ts}; change both together.
 *
 * @see StrongPasswordValidator
 */
@Documented
@Constraint(validatedBy = StrongPasswordValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface StrongPassword {
    /**
     * Left empty: the validator writes a message naming the rule that failed.
     *
     * @return the default message
     */
    String message() default "";

    /**
     * Required by Bean Validation; unused.
     *
     * @return the validation groups
     */
    Class<?>[] groups() default {};

    /**
     * Required by Bean Validation; unused.
     *
     * @return the payload
     */
    Class<? extends Payload>[] payload() default {};
}
