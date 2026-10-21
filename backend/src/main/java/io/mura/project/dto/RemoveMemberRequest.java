package io.mura.project.dto;

import jakarta.validation.constraints.Size;

// The word of explanation that reaches the person removed, or the managers
// when someone leaves. Optional: an empty message sends the event alone.
public record RemoveMemberRequest(
        @Size(max = 500, message = "Le message ne doit pas dépasser 500 caractères.")
        String message
) {}
