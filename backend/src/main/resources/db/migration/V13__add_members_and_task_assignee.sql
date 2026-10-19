-- V13__add_members_and_task_assignee.sql
-- Opens projects to several people: membership now drives access (it used
-- to be owner-only), and a task can carry a single person in charge.

ALTER TABLE tasks ADD COLUMN assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX idx_tasks_assignee_id ON tasks(assignee_id);

-- Owners became members in V5, but projects created through the API since
-- then only got their row from the service. Backfill anything missing so
-- "member of" is the single source of truth for access.
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, p.owner_id, 'OWNER'
FROM projects p
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Fixtures: bob and admin join two of alice's projects, so the member list
-- and the assignment flow have something real to show.
INSERT INTO project_members (project_id, user_id, role)
SELECT p.id, u.id, 'MEMBER'
FROM projects p
CROSS JOIN users u
WHERE p.name IN ('Refonte site vitrine', 'Campagne réseaux sociaux')
  AND u.email IN ('bob@mura.dev', 'admin@mura.dev')
ON CONFLICT (project_id, user_id) DO NOTHING;

-- Spread the existing tasks round-robin over each project's members,
-- leaving roughly one in seven unassigned so the "à assigner" case shows up.
WITH members AS (
    SELECT project_id,
           user_id,
           ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY role, user_id) - 1 AS idx,
           COUNT(*) OVER (PARTITION BY project_id) AS total
    FROM project_members
),
numbered AS (
    SELECT id,
           project_id,
           ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY start_date, id) - 1 AS n
    FROM tasks
)
UPDATE tasks t
SET assignee_id = m.user_id
FROM numbered n
JOIN members m ON m.project_id = n.project_id AND m.idx = n.n % m.total
WHERE t.id = n.id
  AND n.n % 7 <> 0;
