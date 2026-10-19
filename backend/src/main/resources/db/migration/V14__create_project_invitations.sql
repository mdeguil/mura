-- V14__create_project_invitations.sql
-- Joining a project is no longer something the owner does to you: they send
-- an invitation, and you decide. Membership is still what grants access —
-- accepting is what creates the project_members row.

CREATE TABLE project_invitations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    invited_user_id UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    invited_by_id   UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP   NOT NULL DEFAULT now(),
    responded_at    TIMESTAMP
);

CREATE INDEX idx_project_invitations_invited_user ON project_invitations(invited_user_id);
CREATE INDEX idx_project_invitations_project ON project_invitations(project_id);

-- Someone can be invited to the same project again after refusing, but never
-- hold two live invitations at once. A partial index says exactly that, where
-- a plain unique constraint would also block the second invitation.
CREATE UNIQUE INDEX uq_project_invitations_pending
    ON project_invitations(project_id, invited_user_id)
    WHERE status = 'PENDING';

-- Fixtures: one invitation waiting for bob, and one admin already turned
-- down, so both the pending list and the "no longer shown" case are visible.
INSERT INTO project_invitations (project_id, invited_user_id, invited_by_id, status, responded_at)
SELECT p.id,
       (SELECT id FROM users WHERE email = 'bob@mura.dev'),
       p.owner_id,
       'PENDING',
       NULL
FROM projects p
WHERE p.name = 'Conférence annuelle';

INSERT INTO project_invitations (project_id, invited_user_id, invited_by_id, status, responded_at)
SELECT p.id,
       (SELECT id FROM users WHERE email = 'admin@mura.dev'),
       p.owner_id,
       'DECLINED',
       now()
FROM projects p
WHERE p.name = 'App mobile Mura';
