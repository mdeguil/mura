-- V9__create_subtasks.sql
-- Subtasks belonging to a task. A task can only be marked Terminé once
-- all of its subtasks are done.

CREATE TABLE subtasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID         NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    name        VARCHAR(255) NOT NULL,
    done        BOOLEAN      NOT NULL DEFAULT false,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_subtasks_task_id ON subtasks(task_id);
