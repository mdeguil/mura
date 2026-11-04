package io.mura.member.dto;

import io.mura.member.User;

import java.util.UUID;

/**
 * How a person appears inside a project, a carnet or a group. Deliberately
 * says nothing about their application role -- that is
 * {@link AccountResponse}'s business, and a member list is no place to
 * advertise who the administrators are.
 *
 * <p>Suspension is the exception, and it is here on purpose: everybody who
 * works with someone needs to know they are no longer reachable.
 *
 * @param id the person's account id
 * @param email their address, or null where it is withheld
 * @param username their name
 * @param avatarUrl their picture, or null
 * @param suspended whether their account is suspended
 */
public record UserResponse(UUID id, String email, String username, String avatarUrl, boolean suspended) {

    /**
     * Reads an account as others see it.
     *
     * @param user the account
     * @return how it appears to others
     */
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getAvatarUrl(),
                user.isSuspended()
        );
    }
}
