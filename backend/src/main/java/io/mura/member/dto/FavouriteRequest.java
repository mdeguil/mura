package io.mura.member.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Starring or un-starring someone in the carnet.
 *
 * @param favourite true to star them, false to take the star away
 */
public record FavouriteRequest(
        @NotNull(message = "Indique si la personne est en favori.")
        Boolean favourite
) {}
