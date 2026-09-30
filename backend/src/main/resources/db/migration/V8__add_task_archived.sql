-- V8__add_task_archived.sql
-- Tasks are archived before they can be deleted, so removing one is a
-- two-step, reversible action instead of an instant, permanent one.

ALTER TABLE tasks ADD COLUMN archived BOOLEAN NOT NULL DEFAULT false;
