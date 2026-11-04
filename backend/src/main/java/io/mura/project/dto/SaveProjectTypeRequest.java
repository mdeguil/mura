package io.mura.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Creating or editing a project type.
 *
 * @param label up to 50 characters, unique whatever its case; trimmed
 * @param emoji up to 16 chars -- generous on purpose: a flag is two code
 *        points, and a family can be half a dozen joined together, so
 *        counting characters would refuse emoji that render as one; trimmed
 */
public record SaveProjectTypeRequest(
        @NotBlank(message = "Le nom du type est requis.")
        @Size(max = 50, message = "Le nom ne peut pas dépasser 50 caractères.")
        String label,

        @NotBlank(message = "Choisis un emoji.")
        @Size(max = 16, message = "Un seul emoji.")
        String emoji
) {
    /** Trims both fields before the constraints judge them. */
    public SaveProjectTypeRequest {
        label = label == null ? null : label.trim();
        emoji = emoji == null ? null : emoji.trim();
    }
}
