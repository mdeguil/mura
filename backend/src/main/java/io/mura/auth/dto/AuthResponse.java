package io.mura.auth.dto;

import io.mura.member.dto.AccountResponse;

/**
 * What signing in or registering answers with.
 *
 * @param token the JWT to send as {@code Authorization: Bearer} from now on
 * @param user the account it signs in
 */
public record AuthResponse(String token, AccountResponse user) {}
