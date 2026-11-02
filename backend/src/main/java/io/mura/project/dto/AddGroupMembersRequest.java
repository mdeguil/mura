package io.mura.project.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

// Who to bring over from one group. The whole group is just every eligible
// member ticked: the request is the same either way.
public record AddGroupMembersRequest(
        @NotNull(message = "Choisis un groupe.")
        UUID groupId,
        @NotEmpty(message = "Choisis au moins une personne du groupe.")
        List<UUID> memberIds
) {}
