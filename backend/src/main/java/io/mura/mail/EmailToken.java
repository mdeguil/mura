package io.mura.mail;

import io.mura.member.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

/**
 * A code or link mailed to an account. Only a hash of its secret is kept:
 * what is mailed out is the only copy of the real thing. A token works once,
 * until it expires, and only the newest of its kind works at all.
 */
@Entity
@Table(name = "email_tokens")
@Getter
@Setter
public class EmailToken {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmailTokenPurpose purpose;

    // Hashed with the same encoder as a password. What is mailed out is the
    // only copy of the real thing.
    @Column(name = "token_hash", nullable = false)
    private String tokenHash;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "consumed_at")
    private Instant consumedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }

    /**
     * Whether the token can still be used.
     *
     * @param now the moment to judge it at
     * @return true if it is unspent and not yet expired
     */
    public boolean isLive(Instant now) {
        return consumedAt == null && expiresAt.isAfter(now);
    }
}
