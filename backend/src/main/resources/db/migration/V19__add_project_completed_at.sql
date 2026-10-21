-- V19__add_project_completed_at.sql
-- A project said it was Achevé without saying when. The date is recorded
-- the moment it reaches that status, and cleared if it leaves it.

ALTER TABLE projects ADD COLUMN completed_at TIMESTAMP;

-- Projects already marked Achevé: the best date available is when they were
-- last touched, which is in practice the change that completed them.
UPDATE projects SET completed_at = updated_at WHERE status = 'ACHEVE';
