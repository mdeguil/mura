-- V20__create_contacts.sql
-- The carnet filled itself from shared projects and invitations, which meant
-- it could only ever look backwards. A contact is someone you put there on
-- purpose, before you have anything in common with them.

CREATE TABLE contacts (
    owner_id   UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    person_id  UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (owner_id, person_id),
    -- One-way on purpose: adding someone to your carnet is not a request,
    -- and does not put you in theirs.
    CONSTRAINT contacts_not_self CHECK (owner_id <> person_id)
);

CREATE INDEX idx_contacts_owner ON contacts(owner_id);
