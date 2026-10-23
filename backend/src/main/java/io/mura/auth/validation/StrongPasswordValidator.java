package io.mura.auth.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class StrongPasswordValidator implements ConstraintValidator<StrongPassword, String> {

    // 72 is BCrypt's limit, not a policy: beyond it the encoder silently
    // ignores the rest, so a longer password would authenticate on its
    // first 72 characters alone.
    public static final int MIN_LENGTH = 8;
    public static final int MAX_LENGTH = 72;

    @Override
    public boolean isValid(String password, ConstraintValidatorContext context) {
        // Absence is @NotBlank's business; this one only judges what is there.
        if (password == null || password.isEmpty()) {
            return true;
        }

        String problem = firstProblem(password);
        if (problem == null) {
            return true;
        }

        // One message naming the one thing that is missing, rather than
        // reciting the whole rule and leaving the reader to spot their case.
        context.disableDefaultConstraintViolation();
        context.buildConstraintViolationWithTemplate(problem).addConstraintViolation();
        return false;
    }

    private String firstProblem(String password) {
        if (password.length() < MIN_LENGTH) {
            return "Le mot de passe doit contenir au moins " + MIN_LENGTH + " caractères.";
        }
        if (password.length() > MAX_LENGTH) {
            return "Le mot de passe ne peut pas dépasser " + MAX_LENGTH + " caractères.";
        }
        if (password.chars().noneMatch(Character::isUpperCase)) {
            return "Le mot de passe doit contenir au moins une majuscule.";
        }
        if (password.chars().noneMatch(Character::isLowerCase)) {
            return "Le mot de passe doit contenir au moins une minuscule.";
        }
        if (password.chars().noneMatch(Character::isDigit)) {
            return "Le mot de passe doit contenir au moins un chiffre.";
        }
        // Anything that is not a letter, a digit or a space. Spelling out a
        // list would refuse perfectly good characters nobody thought of.
        if (password.chars().noneMatch(c -> !Character.isLetterOrDigit(c) && !Character.isWhitespace(c))) {
            return "Le mot de passe doit contenir au moins un caractère spécial.";
        }
        return null;
    }
}
