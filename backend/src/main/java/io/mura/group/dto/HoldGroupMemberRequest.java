package io.mura.group.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Setting someone aside in a group, or bringing them back. A flag rather
 * than two endpoints: the gérant is setting a state, and sending the state
 * they want avoids the race where two clicks land in the wrong order.
 *
 * @param onHold true to set them aside, false to bring them back
 */
public record HoldGroupMemberRequest(
        @NotNull(message = "Précise si la personne est mise en retrait.")
        Boolean onHold
) {}
