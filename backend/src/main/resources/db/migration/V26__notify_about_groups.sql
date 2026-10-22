-- V26__notify_about_groups.sql
-- Until now every notification was about a project, so project_name was
-- required. A suspended account is news for the owners of the groups that
-- person belongs to, and a group is not a project.

ALTER TABLE notifications
    ALTER COLUMN project_name DROP NOT NULL;

-- A snapshot, for the same reason project_name is one: the group may be
-- renamed or deleted, and the line still has to say what it was about.
ALTER TABLE notifications
    ADD COLUMN group_name VARCHAR(100);

-- Exactly one subject per notification: a project or a group, never both
-- and never neither. The old rows all carry a project and satisfy it.
ALTER TABLE notifications
    ADD CONSTRAINT chk_notifications_subject
        CHECK ((project_name IS NULL) <> (group_name IS NULL));
