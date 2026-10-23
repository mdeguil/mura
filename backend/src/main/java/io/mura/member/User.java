package io.mura.member;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Entity;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(name = "avatar_url")
    private String avatarUrl;

    // What this account may do to the application. Not to be confused with
    // ProjectRole, which says what it may do inside one project.
    @Enumerated(EnumType.STRING)
    @Column(name = "account_role", nullable = false)
    private AccountRole accountRole = AccountRole.USER;

    // Set when an administrator suspends the account. Nothing it produced
    // is removed; it simply cannot sign in, and its token stops working.
    @Column(name = "suspended_at")
    private Instant suspendedAt;

    public boolean isSuspended() {
        return suspendedAt != null;
    }

    // Set when the code mailed at registration came back. Accounts made
    // before Mura asked for one were stamped verified by the migration.
    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    public boolean isEmailVerified() {
        return emailVerifiedAt != null;
    }

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }
}
