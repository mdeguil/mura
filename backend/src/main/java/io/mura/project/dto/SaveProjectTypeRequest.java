package io.mura.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SaveProjectTypeRequest(
        @NotBlank(message = "Le nom du type est requis.")
        @Size(max = 50, message = "Le nom ne peut pas dépasser 50 caractères.")
        String label,

        @NotBlank(message = "Choisis un emoji.")
        // Generous on purpose: a flag is two code points, and a family can be
        // half a dozen joined together. Counting characters here would refuse
        // emoji that render as one.
        @Size(max = 16, message = "Un seul emoji.")
        String emoji
) {
    public SaveProjectTypeRequest {
        label = label == null ? null : label.trim();
        emoji = emoji == null ? null : emoji.trim();
    }
}
