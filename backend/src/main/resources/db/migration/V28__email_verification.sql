-- V28__email_verification.sql
-- An address nobody confirmed is an address nobody can be reached at, and
-- the address is how Mura invites people. Registration now sends a code.

ALTER TABLE users
    ADD COLUMN email_verified_at TIMESTAMP;

-- Accounts that predate this were made when no proof was asked for. Leaving
-- them unverified would lock out everyone who already uses Mura, including
-- the only administrator.
UPDATE users SET email_verified_at = created_at;

-- One table for both errands: the six digits that confirm an address, and
-- the long random string in a reset link. Same lifecycle -- issued, used
-- once, expires -- so one table rather than two that drift apart.
CREATE TABLE email_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    purpose    VARCHAR(30) NOT NULL,
    -- Hashed, like a password: the database is not the place to keep
    -- something that opens an account.
    token_hash VARCHAR(255) NOT NULL,
    -- Counted so a six-digit code cannot be guessed by trying them all.
    attempts   INTEGER     NOT NULL DEFAULT 0,
    expires_at TIMESTAMP   NOT NULL,
    consumed_at TIMESTAMP,
    created_at TIMESTAMP   NOT NULL DEFAULT now(),
    CONSTRAINT chk_email_tokens_purpose
        CHECK (purpose IN ('EMAIL_VERIFICATION', 'PASSWORD_RESET'))
);

-- Finding the live one for a person, which is the only lookup there is.
CREATE INDEX idx_email_tokens_user
    ON email_tokens(user_id, purpose)
    WHERE consumed_at IS NULL;
