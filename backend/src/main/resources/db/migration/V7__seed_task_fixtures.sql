-- V7__seed_task_fixtures.sql
-- Task fixtures spanning September 2026 to end of January 2027, so the
-- Gantt chart and status board can be exercised across several months
-- (month-boundary rendering, year rollover, overlapping ranges, every
-- status value).

DELETE FROM tasks;

INSERT INTO tasks (project_id, name, description, status, start_date, end_date) VALUES
    ((SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Audit UX existant', 'Analyse du site actuel et des points de friction.', 'TERMINE', '2026-09-01', '2026-09-12'),
    ((SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Benchmark concurrentiel', 'Étude des sites concurrents et tendances du secteur.', 'TERMINE', '2026-09-08', '2026-09-20'),
    ((SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Wireframes desktop', 'Structuration des pages clés en wireframes.', 'EN_COURS', '2026-09-22', '2026-10-05'),
    ((SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Maquettes UI desktop', 'Déclinaison graphique des wireframes desktop.', 'EN_COURS', '2026-10-01', '2026-10-20'),
    ((SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Maquettes UI mobile', 'Adaptation des maquettes desktop au mobile.', 'A_FAIRE', '2026-10-15', '2026-11-02'),
    ((SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Intégration front', 'Découpage HTML/CSS et intégration des composants.', 'A_FAIRE', '2026-11-03', '2026-12-05'),
    ((SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Intégration back / CMS', 'Branchement du CMS et des contenus dynamiques.', 'A_FAIRE', '2026-11-10', '2026-12-15'),
    ((SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Tests & recette', 'Recette fonctionnelle et corrections de bugs.', 'A_FAIRE', '2026-12-16', '2027-01-15'),
    ((SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Migration & mise en ligne', 'Bascule DNS et mise en production.', 'A_FAIRE', '2027-01-16', '2027-01-31');
