package io.mura.auth.validation;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class StrongPasswordValidatorTest {

    record Form(@StrongPassword String password) {}

    private static jakarta.validation.ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void start() {
        factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void stop() {
        factory.close();
    }

    private Set<ConstraintViolation<Form>> check(String password) {
        return validator.validate(new Form(password));
    }

    @ParameterizedTest
    @ValueSource(strings = {"Secret-123", "Mot de passe 9!", "Àccentué-7", "Ab1$abcd"})
    void aPasswordThatMeetsEveryRulePasses(String password) {
        assertThat(check(password)).isEmpty();
    }

    @ParameterizedTest
    @NullAndEmptySource
    void absenceIsLeftToNotBlank(String password) {
        assertThat(check(password)).isEmpty();
    }

    @ParameterizedTest(name = "« {0} » → {1}")
    @CsvSource(delimiter = '|', value = {
            "Ab1$     | au moins 8 caractères",
            "secret-123 | au moins une majuscule",
            "SECRET-123 | au moins une minuscule",
            "Secret-abc | au moins un chiffre",
            "Secret 123 | au moins un caractère spécial"
    })
    void eachMissingRuleIsNamedOnItsOwn(String password, String expected) {
        assertThat(check(password.strip())).singleElement()
                .satisfies(v -> assertThat(v.getMessage()).contains(expected));
    }

    @org.junit.jupiter.api.Test
    void beyondBcryptsLimitIsRefusedRatherThanSilentlyCut() {
        String tooLong = "Aa1!" + "x".repeat(StrongPasswordValidator.MAX_LENGTH);

        assertThat(check(tooLong)).singleElement()
                .satisfies(v -> assertThat(v.getMessage()).contains("ne peut pas dépasser 72"));
    }
}
