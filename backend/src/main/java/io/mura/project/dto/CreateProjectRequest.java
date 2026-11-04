package io.mura.project.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;
import java.util.List;

/**
 * Creating a project.
 *
 * @param name up to 255 characters
 * @param description up to 2000 characters, or null
 * @param color {@code #rrggbb}, or null for the default
 * @param typeId the project type
 * @param startDate when it starts, or null
 * @param invitedEmails people to invite right away, up to 20, or null.
 *        They are invited, not added: the project opens to them only once
 *        they accept
 * @param groupId one of the creator's groups, brought on whole, or null.
 *        Unlike the invitations, its people are added: they are on the team
 *        as soon as the project exists, and told so
 */
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

        @Size(max = 20, message = "Pas plus de 20 personnes à inviter à la création.")
        List<@Email(message = "Un des emails n'est pas valide.") String> invitedEmails,

        UUID groupId
) {}
