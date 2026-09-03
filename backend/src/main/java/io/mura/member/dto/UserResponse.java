package io.mura.member.dto;

import io.mura.member.User;

import java.util.UUID;

public record UserResponse(UUID id, String email, String username, String avatarUrl) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getEmail(), user.getUsername(), user.getAvatarUrl());
    }
}
