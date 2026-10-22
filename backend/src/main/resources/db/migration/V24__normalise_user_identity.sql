-- V24__normalise_user_identity.sql
-- An account's identity is unique ignoring case.
--
-- Until now the uniqueness checks on registration were case-sensitive while
-- every lookup by email (invitations, carnet, groups) was not. So
-- "Alice@Mura.dev" could register alongside "alice@mura.dev", and the next
-- lookup matching both rows failed with "Query did not return a unique
-- result" -- a 500 on a perfectly ordinary action.

-- An email has one spelling: lowercase. Nobody reads their own address for
-- its capitals, and the address is the login.
UPDATE users SET email = lower(trim(email)) WHERE email <> lower(trim(email));

-- A username keeps the case its owner chose -- it is a display name. Only
-- its uniqueness ignores case, so "alice" and "ALICE" cannot coexist.
UPDATE users SET username = trim(username) WHERE username <> trim(username);

-- Indexes rather than application checks: two simultaneous registrations
-- both pass an exists() check, and only the database can refuse the second.
-- If either index fails to build, the table already holds a collision the
-- UPDATEs above could not resolve -- Postgres names the offending value.
CREATE UNIQUE INDEX uq_users_email_lower ON users (lower(email));
CREATE UNIQUE INDEX uq_users_username_lower ON users (lower(username));
