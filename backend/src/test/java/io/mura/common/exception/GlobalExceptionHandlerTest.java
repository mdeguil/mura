package io.mura.common.exception;

import io.mura.support.ControllerTestSupport;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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

        @GetMapping("/items/{id}")
        void item(@PathVariable UUID id) {}

        // What the dispatcher throws for an address no controller answers;
        // a standalone MockMvc answers 404 on its own without it.
        @GetMapping("/gone")
        void gone() throws NoResourceFoundException {
            throw new NoResourceFoundException(HttpMethod.GET, "gone");
        }
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
    void aValidationFailureNamesTheFieldHighestUpTheForm() throws Exception {
        // Both fields are wrong; the answer must not depend on the order the
        // validator happened to find them in.
        for (int i = 0; i < 5; i++) {
            mvc.perform(withJson(post("/form"), "{\"name\":\"\",\"code\":\"ABCD\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value("Le nom est requis."))
                    .andExpect(jsonPath("$.field").value("name"));
        }
    }

    @Test
    void aMalformedBodyIsTheCallersMistake() throws Exception {
        mvc.perform(withJson(post("/form"), "{pas du json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Le contenu de la requête est illisible."));
    }

    @Test
    void anIdThatIsNotAUuidNamesTheParameter() throws Exception {
        mvc.perform(get("/items/{id}", "pas-un-uuid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("L'adresse contient une valeur invalide (id)."));
    }

    @Test
    void anAddressNobodyAnswersIsA404() throws Exception {
        mvc.perform(get("/gone"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Cette adresse n'existe pas."));
    }

    @Test
    void theWrongMethodIsA405ThatSaysWhichOnesWork() throws Exception {
        mvc.perform(delete("/form"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(header().string("Allow", "POST"));
    }

    @Test
    void aBodyInAnotherFormatIsA415() throws Exception {
        mvc.perform(post("/form").contentType(MediaType.TEXT_PLAIN).content("name=x"))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void anythingUnexpectedIsA500WithoutItsInternals() throws Exception {
        mvc.perform(get("/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("Une erreur inattendue est survenue."))
                .andExpect(jsonPath("$.field").doesNotExist());
    }
}
