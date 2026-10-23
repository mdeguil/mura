package io.mura.project.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;
import java.util.List;

public record CreateProjectRequest(
        @NotBlank(message = "Le nom du projet est requis.")
        @Size(max = 255, message = "Le nom du projet ne doit pas dépasser 255 caractères.")
        String name,

        @Size(max = 2000, message = "La description ne doit pas dépasser 2000 caractères.")
        String description,

        @Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "La couleur doit être un code hexadécimal (ex: #14b8a6).")
        String color,

        @NotNull(message = "Le type de projet est requis.")
        UUID typeId,

        LocalDate startDate,

        // People to invite right away. They are invited, not added: the
        // project opens to them only once they accept.
        @Size(max = 20, message = "Pas plus de 20 personnes à inviter à la création.")
        List<@Email(message = "Un des emails n'est pas valide.") String> invitedEmails
) {}
