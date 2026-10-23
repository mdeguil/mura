package io.mura.member.dto;

import io.mura.member.AccountRole;
import io.mura.member.User;

import java.time.Instant;
import java.util.UUID;

// An account seen as an account: who it is, what it may do to the
// application, and whether it is still allowed in. Distinct from
// UserResponse, which is how a person appears inside a project or a carnet
// and deliberately says nothing about their application role.
public record AccountResponse(
        UUID id,
        String email,
        String username,
        String avatarUrl,
        AccountRole accountRole,
        boolean suspended,
        // The client shows the code screen and nothing else until this
        // is true, so it has to come back with the account.
        boolean emailVerified,
        Instant suspendedAt,
        Instant createdAt
) {
    public static AccountResponse from(User user) {
        return new AccountResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getAvatarUrl(),
                user.getAccountRole(),
                user.isSuspended(),
                user.isEmailVerified(),
                user.getSuspendedAt(),
                user.getCreatedAt()
        );
    }
}
