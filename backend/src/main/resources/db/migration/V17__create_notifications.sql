-- V17__create_notifications.sql
-- Until now the only thing that notified anyone was an invitation, and its
-- read/dismissed flags lived on the invitation itself. Leaving a project and
-- being removed from one also have something to say — with a word of
-- explanation attached — and neither is an invitation.

CREATE TABLE notifications (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type         VARCHAR(40)  NOT NULL,
    project_id   UUID         REFERENCES projects(id) ON DELETE CASCADE,
    -- Snapshots: someone removed from a project can no longer read its name,
    -- and the notification still has to say which project it was about.
    project_name VARCHAR(255) NOT NULL,
    actor_name   VARCHAR(50)  NOT NULL,
    message      TEXT,
    read_at      TIMESTAMP,
    created_at   TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
