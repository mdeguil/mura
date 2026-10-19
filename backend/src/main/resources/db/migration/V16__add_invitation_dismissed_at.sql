-- V16__add_invitation_dismissed_at.sql
-- Clearing a notification is not answering the invitation: the bell stops
-- showing it, while the invitation itself stays pending and findable from
-- the projects list. Three separate moments now: read, dismissed, answered.

ALTER TABLE project_invitations ADD COLUMN dismissed_at TIMESTAMP;
