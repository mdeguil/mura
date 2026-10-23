package io.mura.group.dto;

import jakarta.validation.constraints.NotNull;

// Put aside, or brought back. A flag rather than two endpoints: the gérant
// is setting a state, and sending the state they want avoids the race where
// two clicks land in the wrong order.
public record HoldGroupMemberRequest(
        @NotNull(message = "Précise si la personne est mise en retrait.")
        Boolean onHold
) {}
