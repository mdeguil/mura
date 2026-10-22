-- V27__contact_requests.sql
-- V20 said, in as many words, that adding someone to your carnet was not a
-- request. It is one now: the person is told, and nothing happens to either
-- carnet until they agree. Accepting is mutual -- you end up in each other's
-- carnets, the way accepting a project invitation puts you on the team.

ALTER TABLE contacts
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACCEPTED';

-- Rows that already exist were added back when adding was unilateral. They
-- stay as they are: nobody's carnet should empty itself into a queue of
-- requests because the rules changed underneath it.

ALTER TABLE contacts
    ADD CONSTRAINT chk_contacts_status
        CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED'));

CREATE INDEX idx_contacts_person_pending
    ON contacts(person_id)
    WHERE status = 'PENDING';

-- A contact request is about a person, not a project or a group, so it has
-- neither name to carry -- the person is already in actor_name. V26 required
-- exactly one subject; at most one is the honest rule.
ALTER TABLE notifications
    DROP CONSTRAINT chk_notifications_subject;

ALTER TABLE notifications
    ADD CONSTRAINT chk_notifications_subject
        CHECK (project_name IS NULL OR group_name IS NULL);
