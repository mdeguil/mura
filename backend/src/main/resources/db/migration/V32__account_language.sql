-- V32__account_language.sql
-- The language an account reads Mura in: its mails and notifications are
-- written in it, whoever caused them. Accounts made before this read French,
-- the language Mura spoke until then.

ALTER TABLE users
    ADD COLUMN language VARCHAR(2) NOT NULL DEFAULT 'fr';

ALTER TABLE users
    ADD CONSTRAINT chk_users_language CHECK (language IN ('fr', 'en'));
