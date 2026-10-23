package io.mura.auth.dto;

import io.mura.auth.validation.StrongPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.Locale;

public record RegisterRequest(
        @NotBlank(message = "Le nom d'utilisateur est requis.")
        @Size(min = 3, max = 50, message = "Le nom d'utilisateur doit contenir entre 3 et 50 caractères.")
        // \p{L} rather than a-z: Mathéo and Zoë are names, not typos. What is
        // refused is whitespace and punctuation that would make a username
        // impossible to say out loud or to type back into an invitation.
        @Pattern(
                regexp = "^[\\p{L}\\p{N}][\\p{L}\\p{N}._-]*$",
                message = "Le nom d'utilisateur accepte les lettres, chiffres, point, tiret et underscore, sans espace."
        )
        String username,

        @NotBlank(message = "L'email est requis.")
        @Email(message = "L'email n'est pas valide.")
        @Size(max = 255, message = "L'email ne peut pas dépasser 255 caractères.")
        String email,

        @NotBlank(message = "Le mot de passe est requis.")
        @StrongPassword
        String password
) {
    // Normalising here rather than in the service, because this runs at
    // deserialisation and the constraints above run after it: an address
    // pasted with a trailing space would otherwise be rejected as invalid
    // rather than simply trimmed. The password is left exactly as typed --
    // whitespace in a password is a character like any other.
    public RegisterRequest {
        username = username == null ? null : username.trim();
        // An email has one stored spelling, lowercase: it is the login, and
        // it is how invitations and the carnet find a person.
        email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
