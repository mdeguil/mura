package io.mura.member.dto;

import io.mura.member.User;

import java.util.UUID;

// How a person appears inside a project, a carnet or a group. Deliberately
// says nothing about their application role -- that is AccountResponse's
// business, and a member list is no place to advertise who the
// administrators are.
//
// Suspension is the exception, and it is here on purpose: everybody who
// works with someone needs to know they are no longer reachable.
public record UserResponse(UUID id, String email, String username, String avatarUrl, boolean suspended) {

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
