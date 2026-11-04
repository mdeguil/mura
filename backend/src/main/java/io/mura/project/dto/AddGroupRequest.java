package io.mura.project.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Which group to bring onto the project. Only the group: it comes whole,
 * and the server works out who in it can come.
 *
 * @param groupId the group, which the caller must belong to
 */
public record AddGroupRequest(
        @NotNull(message = "Choisis un groupe.")
        UUID groupId
) {}
