-- V11__create_task_status_history.sql
-- Tracks every status change on a task, so the task detail view can show
-- a history of how it moved through the pipeline.

CREATE TABLE task_status_history (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status   VARCHAR(20) NOT NULL,
    changed_at  TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_task_status_history_task_id ON task_status_history(task_id);

-- Backfill: one "created at this status" entry per existing task, so
-- every task already has something to show in its history.
INSERT INTO task_status_history (task_id, from_status, to_status, changed_at)
SELECT id, NULL, status, created_at FROM tasks;
