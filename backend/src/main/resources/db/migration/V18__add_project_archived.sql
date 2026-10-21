-- V18__add_project_archived.sql
-- A project could be created and never undone. Deleting one takes its tasks,
-- subtasks, status history, members and invitations with it, so it goes
-- through a bin first — the same archive-then-delete the task board uses.

ALTER TABLE projects ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_projects_archived ON projects(archived);
