package io.mura.project.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

// Which group to bring onto the project. Only the group: it comes whole,
// and the server works out who in it can come.
public record AddGroupRequest(
        @NotNull(message = "Choisis un groupe.")
        UUID groupId
) {}
