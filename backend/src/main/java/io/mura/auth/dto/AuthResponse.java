package io.mura.auth.dto;

import io.mura.member.dto.AccountResponse;

public record AuthResponse(String token, AccountResponse user) {}
