package io.mura.project.dto;

import jakarta.validation.constraints.Size;

/**
 * Taking someone off a team, or leaving it.
 *
 * @param message the word of explanation that reaches the person removed,
 *        or the managers when someone leaves; up to 500 characters.
 *        Optional: an empty message sends the event alone
 */
public record RemoveMemberRequest(
        @Size(max = 500, message = "Le message ne doit pas dépasser 500 caractères.")
        String message
) {}
