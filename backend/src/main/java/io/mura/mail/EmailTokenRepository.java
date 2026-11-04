package io.mura.mail;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

/** The codes and links mailed to confirm an address or reset a password. */
public interface EmailTokenRepository extends JpaRepository<EmailToken, UUID> {

    /**
     * An account's unspent tokens for one purpose, newest first. Expired
     * ones are included: the caller checks {@link EmailToken#isLive}.
     *
     * @param userId the account
     * @param purpose what the tokens are for
     * @return the unspent tokens, with their account
     */
    @Query("""
            SELECT t FROM EmailToken t
            JOIN FETCH t.user
            WHERE t.user.id = :userId AND t.purpose = :purpose AND t.consumedAt IS NULL
            ORDER BY t.createdAt DESC
            """)
    List<EmailToken> findLiveForUser(
            @Param("userId") UUID userId,
            @Param("purpose") EmailTokenPurpose purpose
    );

    /**
     * One token by its id, with its account. A reset link carries its own
     * row id alongside the secret, so checking one is a single lookup and a
     * single hash comparison. Matching a bare secret against every live
     * token would be one bcrypt per row, on an endpoint anybody can call.
     *
     * @param id the token's id, as the link carries it
     * @return the token, if it exists
     */
    @Query("""
            SELECT t FROM EmailToken t
            JOIN FETCH t.user
            WHERE t.id = :id
            """)
    java.util.Optional<EmailToken> findWithUser(@Param("id") UUID id);
}
