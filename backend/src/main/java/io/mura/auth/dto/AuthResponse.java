package io.mura.auth.dto;

import io.mura.member.dto.UserResponse;

public record AuthResponse(String token, UserResponse user) {}
