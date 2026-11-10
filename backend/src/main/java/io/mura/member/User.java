package io.mura.member;

import io.mura.common.i18n.Texts;
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
import java.util.Locale;
import java.util.UUID;

/**
 * An account. Email and username are unique whatever their case; the
 * password is stored as a BCrypt hash.
 */
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

    @Enumerated(EnumType.STRING)
    @Column(name = "account_role", nullable = false)
    private AccountRole accountRole = AccountRole.USER;

    @Column(name = "suspended_at")
    private Instant suspendedAt;

    /**
     * Whether an administrator has suspended the account. Nothing it
     * produced is removed; it simply cannot sign in, and its token stops
     * working.
     *
     * @return true while {@code suspendedAt} is set
     */
    public boolean isSuspended() {
        return suspendedAt != null;
    }

    /**
     * The language the account reads Mura in, {@code fr} or {@code en}: its
     * mails and notifications are written in it, whoever caused them. It
     * follows the interface: set at sign-up and sign-in from the language
     * on screen, and each time the person switches.
     */
    @Column(nullable = false, length = 2)
    private String language = "fr";

    /**
     * The account's language as a locale, for writing to it.
     *
     * @return French or English
     */
    public Locale getLocale() {
        return Texts.language(language);
    }

    @Column(name = "email_verified_at")
    private Instant emailVerifiedAt;

    /**
     * Whether the address has been confirmed with the code mailed at
     * registration. Until then the account reaches only the verification
     * routes.
     *
     * @return true once {@code emailVerifiedAt} is set
     */
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
