-- V12__seed_bulk_tasks.sql
-- Bulk tasks on "Refonte site vitrine" to see how the planning views hold
-- up with a realistic workload: ~50 tasks total, heavily overlapping, with
-- mixed statuses, short and multi-week durations, and a few archived.

WITH inserted AS (
    INSERT INTO tasks (project_id, name, description, status, start_date, end_date, archived)
    SELECT
        p.id,
        'Lot ' || g.i || ' — ' || (ARRAY[
            'audit', 'maquettes', 'intégration', 'contenus',
            'SEO', 'tests', 'recette', 'déploiement'
        ])[1 + (g.i % 8)],
        'Tâche de charge, générée pour éprouver l''affichage du planning.',
        (ARRAY['A_FAIRE', 'EN_COURS', 'TERMINE'])[1 + (g.i % 3)],
        DATE '2026-09-01' + (g.i * 3) % 150,
        DATE '2026-09-01' + (g.i * 3) % 150
            -- every 7th task runs long, to exercise multi-week spans
            + CASE WHEN g.i % 7 = 0 THEN 25 + (g.i % 10) ELSE 1 + (g.i % 12) END,
        g.i % 13 = 0
    FROM projects p, generate_series(1, 41) AS g(i)
    WHERE p.name = 'Refonte site vitrine'
    RETURNING id, status, created_at
)
INSERT INTO task_status_history (task_id, from_status, to_status, changed_at)
SELECT id, NULL, status, created_at FROM inserted;

-- Three checkpoints on each generated "en cours" task, only the first done,
-- so the "can't validate until every subtask is checked" rule is visible.
INSERT INTO subtasks (task_id, name, done)
SELECT t.id, 'Point de contrôle ' || s.n, s.n = 1
FROM tasks t
JOIN projects p ON p.id = t.project_id
CROSS JOIN generate_series(1, 3) AS s(n)
WHERE p.name = 'Refonte site vitrine'
  AND t.name LIKE 'Lot %'
  AND t.status = 'EN_COURS';
