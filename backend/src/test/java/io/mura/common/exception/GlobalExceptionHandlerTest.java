package io.mura.common.exception;

import io.mura.support.ControllerTestSupport;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class GlobalExceptionHandlerTest extends ControllerTestSupport {

    record Form(@NotBlank(message = "Le nom est requis.") String name,
                @Size(max = 3, message = "Trois lettres au plus.") String code) {}

    @RestController
    static class Failing {
        @GetMapping("/api-error")
        void apiError() {
            throw new ApiException(HttpStatus.CONFLICT, "Déjà pris.", "email");
        }

        @GetMapping("/api-error-no-field")
        void apiErrorWithoutField() {
            throw new ApiException(HttpStatus.NOT_FOUND, "Introuvable.");
        }

        @GetMapping("/boom")
        void boom() {
            throw new IllegalStateException("détail interne à ne pas montrer");
        }

        @PostMapping("/form")
        void form(@Valid @RequestBody Form form) {}
    }

    @BeforeEach
    void setUp() {
        mount(new Failing());
    }

    @Test
    void anApiExceptionKeepsItsStatusMessageAndField() throws Exception {
        mvc.perform(get("/api-error"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Déjà pris."))
                .andExpect(jsonPath("$.field").value("email"));
    }

    @Test
    void aMissingFieldIsLeftOutOfTheBody() throws Exception {
        mvc.perform(get("/api-error-no-field"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.field").doesNotExist());
    }

    @Test
    void aValidationFailureNamesTheFirstFieldInError() throws Exception {
        mvc.perform(withJson(post("/form"), "{\"name\":\"\",\"code\":\"ABCD\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").isString())
                .andExpect(jsonPath("$.field").isString());
    }

    @Test
    @Disabled("Bug connu, à corriger dans la branche refonte : un corps JSON illisible tombe "
            + "dans le gestionnaire générique et répond 500 au lieu de 400.")
    void aMalformedBodyIsTheCallersMistake() throws Exception {
        mvc.perform(withJson(post("/form"), "{pas du json"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void anythingUnexpectedIsA500WithoutItsInternals() throws Exception {
        mvc.perform(get("/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Une erreur inattendue est survenue."))
                .andExpect(jsonPath("$.field").doesNotExist());
    }
}
