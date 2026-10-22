package io.mura.member.dto;

import jakarta.validation.constraints.NotNull;

public record FavouriteRequest(
        @NotNull(message = "Indique si la personne est en favori.")
        Boolean favourite
) {}
