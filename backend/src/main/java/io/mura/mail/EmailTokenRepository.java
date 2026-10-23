package io.mura.mail;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface EmailTokenRepository extends JpaRepository<EmailToken, UUID> {

    // A reset link carries its own row id alongside the secret, so checking
    // one is a single lookup and a single hash comparison. Matching a bare
    // secret against every live token would be one bcrypt per row, on an
    // endpoint anybody can call.
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

    @Query("""
            SELECT t FROM EmailToken t
            JOIN FETCH t.user
            WHERE t.id = :id
            """)
    java.util.Optional<EmailToken> findWithUser(@Param("id") UUID id);
}
