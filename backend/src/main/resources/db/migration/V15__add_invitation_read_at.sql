-- V15__add_invitation_read_at.sql
-- The bell counts invitations the person has not looked at yet, so an
-- invitation needs to remember whether it has been seen. Null means unread;
-- the fixtures stay unread so the counter has something to show.

ALTER TABLE project_invitations ADD COLUMN read_at TIMESTAMP;
