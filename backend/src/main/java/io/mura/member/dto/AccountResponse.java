package io.mura.member.dto;

import io.mura.member.AccountRole;
import io.mura.member.User;

import java.time.Instant;
import java.util.UUID;

/**
 * An account seen as an account: who it is, what it may do to the
 * application, and whether it is still allowed in. Distinct from
 * {@link UserResponse}, which is how a person appears inside a project or a
 * carnet and deliberately says nothing about their application role.
 *
 * @param id the account's id
 * @param email its address
 * @param username its name
 * @param avatarUrl its picture, or null
 * @param accountRole what it may do to the application
 * @param suspended whether an administrator has suspended it
 * @param emailVerified whether its address is confirmed; the client shows
 *        the code screen and nothing else until it is
 * @param suspendedAt when it was suspended, or null
 * @param createdAt when it was registered
 * @param language the language it reads Mura in, {@code fr} or {@code en}
 */
public record AccountResponse(
        UUID id,
        String email,
        String username,
        String avatarUrl,
        AccountRole accountRole,
        boolean suspended,
        boolean emailVerified,
        Instant suspendedAt,
        Instant createdAt,
        String language
) {
    /**
     * Reads an account as the client sees it.
     *
     * @param user the account
     * @return how the client sees it
     */
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
                user.getCreatedAt(),
                user.getLanguage()
        );
    }
}
