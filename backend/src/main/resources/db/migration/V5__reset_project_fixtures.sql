-- V5__reset_project_fixtures.sql
-- Wipes existing projects and replaces them with a handful of fixtures,
-- all owned by the alice@mura.dev test account.

DELETE FROM project_members;
DELETE FROM projects;

INSERT INTO projects (id, name, description, color, type, start_date, status, owner_id) VALUES
    (gen_random_uuid(), 'Refonte site vitrine', 'Nouvelle identité visuelle et refonte UX complète du site.', '#3b82f6', 'WEB', '2026-09-15', 'EN_COURS', (SELECT id FROM users WHERE email = 'alice@mura.dev')),
    (gen_random_uuid(), 'Campagne réseaux sociaux', 'Plan de contenu et publicités pour le lancement Q4.', '#ec4899', 'MARKETING', '2026-10-01', 'A_VENIR', (SELECT id FROM users WHERE email = 'alice@mura.dev')),
    (gen_random_uuid(), 'App mobile Mura', 'Application iOS/Android pour gérer ses boards en déplacement.', '#22c55e', 'MOBILE', '2026-06-01', 'ACHEVE', (SELECT id FROM users WHERE email = 'alice@mura.dev')),
    (gen_random_uuid(), 'Conférence annuelle', 'Organisation logistique et programme de la conférence.', '#f97316', 'EVENEMENT', '2026-11-20', 'A_VENIR', (SELECT id FROM users WHERE email = 'alice@mura.dev'));

INSERT INTO project_members (project_id, user_id, role)
SELECT id, owner_id, 'OWNER' FROM projects;
