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
        @NotBlank(message = "{validation.type.nameRequired}")
        @Size(max = 50, message = "{validation.name.max50}")
        String label,

        @NotBlank(message = "{validation.emoji.required}")
        @Size(max = 16, message = "{validation.emoji.single}")
        String emoji
) {
    /** Trims both fields before the constraints judge them. */
    public SaveProjectTypeRequest {
        label = label == null ? null : label.trim();
        emoji = emoji == null ? null : emoji.trim();
    }
}
