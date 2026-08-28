package io.mura.auth.dto;

public record AuthResponse(String token, UserResponse user) {}
