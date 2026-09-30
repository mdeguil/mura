-- V10__reset_all_task_fixtures.sql
-- Full reset of task fixtures across every project, so the Planning,
-- Tâches and Archivé views can all be exercised: every status, archived
-- tasks, and subtasks both complete and incomplete (to show the
-- "can't validate until subtasks are done" rule) on more than one project.

DELETE FROM subtasks;
DELETE FROM tasks;

-- Refonte site vitrine (Web, en cours)
INSERT INTO tasks (id, project_id, name, description, status, start_date, end_date, archived) VALUES
    ('00000000-0000-0000-0001-000000000001', (SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Audit UX existant', 'Analyse du site actuel et des points de friction.', 'TERMINE', '2026-09-01', '2026-09-12', false),
    ('00000000-0000-0000-0001-000000000002', (SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Benchmark concurrentiel', 'Étude des sites concurrents et tendances du secteur.', 'TERMINE', '2026-09-08', '2026-09-20', false),
    ('00000000-0000-0000-0001-000000000003', (SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Wireframes desktop', 'Structuration des pages clés en wireframes.', 'TERMINE', '2026-09-22', '2026-10-05', false),
    ('00000000-0000-0000-0001-000000000004', (SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Maquettes UI desktop', 'Déclinaison graphique des wireframes desktop.', 'EN_COURS', '2026-10-01', '2026-10-20', false),
    ('00000000-0000-0000-0001-000000000005', (SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Maquettes UI mobile', 'Adaptation des maquettes desktop au mobile.', 'A_FAIRE', '2026-10-15', '2026-11-02', false),
    ('00000000-0000-0000-0001-000000000006', (SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Intégration front', 'Découpage HTML/CSS et intégration des composants.', 'A_FAIRE', '2026-11-03', '2026-12-05', false),
    ('00000000-0000-0000-0001-000000000007', (SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Intégration back / CMS', 'Branchement du CMS et des contenus dynamiques.', 'A_FAIRE', '2026-11-10', '2026-12-15', false),
    ('00000000-0000-0000-0001-000000000008', (SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Tests & recette', 'Recette fonctionnelle et corrections de bugs.', 'A_FAIRE', '2026-12-16', '2027-01-15', false),
    ('00000000-0000-0000-0001-000000000009', (SELECT id FROM projects WHERE name = 'Refonte site vitrine'), 'Migration & mise en ligne', 'Bascule DNS et mise en production.', 'A_FAIRE', '2027-01-16', '2027-01-31', true);

-- Campagne réseaux sociaux (Marketing, à venir)
INSERT INTO tasks (id, project_id, name, description, status, start_date, end_date, archived) VALUES
    ('00000000-0000-0000-0002-000000000001', (SELECT id FROM projects WHERE name = 'Campagne réseaux sociaux'), 'Définir la ligne éditoriale', 'Ton, thèmes et fréquence de publication.', 'TERMINE', '2026-09-20', '2026-09-30', false),
    ('00000000-0000-0000-0002-000000000002', (SELECT id FROM projects WHERE name = 'Campagne réseaux sociaux'), 'Créer les visuels', 'Déclinaison des visuels par réseau.', 'EN_COURS', '2026-10-01', '2026-10-15', false),
    ('00000000-0000-0000-0002-000000000003', (SELECT id FROM projects WHERE name = 'Campagne réseaux sociaux'), 'Planifier le calendrier de publication', 'Répartition des posts sur le trimestre.', 'A_FAIRE', '2026-10-10', '2026-10-25', false),
    ('00000000-0000-0000-0002-000000000004', (SELECT id FROM projects WHERE name = 'Campagne réseaux sociaux'), 'Lancer les publicités payantes', 'Mise en ligne des campagnes sponsorisées.', 'A_FAIRE', '2026-10-20', '2026-11-10', false),
    ('00000000-0000-0000-0002-000000000005', (SELECT id FROM projects WHERE name = 'Campagne réseaux sociaux'), 'Brief influenceurs (annulé)', 'Partenariat abandonné faute de budget.', 'A_FAIRE', '2026-10-01', '2026-10-05', true);

-- App mobile Mura (Mobile, achevé)
INSERT INTO tasks (id, project_id, name, description, status, start_date, end_date, archived) VALUES
    ('00000000-0000-0000-0003-000000000001', (SELECT id FROM projects WHERE name = 'App mobile Mura'), 'Spécifications fonctionnelles', 'Cadrage des fonctionnalités clés de l''app.', 'TERMINE', '2026-06-01', '2026-06-10', false),
    ('00000000-0000-0000-0003-000000000002', (SELECT id FROM projects WHERE name = 'App mobile Mura'), 'Design UI/UX', 'Maquettes et prototypes des écrans principaux.', 'TERMINE', '2026-06-08', '2026-06-25', false),
    ('00000000-0000-0000-0003-000000000003', (SELECT id FROM projects WHERE name = 'App mobile Mura'), 'Développement iOS', 'Implémentation de l''application iOS.', 'TERMINE', '2026-06-20', '2026-08-15', false),
    ('00000000-0000-0000-0003-000000000004', (SELECT id FROM projects WHERE name = 'App mobile Mura'), 'Développement Android', 'Implémentation de l''application Android.', 'TERMINE', '2026-06-20', '2026-08-15', false),
    ('00000000-0000-0000-0003-000000000005', (SELECT id FROM projects WHERE name = 'App mobile Mura'), 'Tests & publication stores', 'Recette finale et soumission aux stores.', 'TERMINE', '2026-08-10', '2026-09-01', false),
    ('00000000-0000-0000-0003-000000000006', (SELECT id FROM projects WHERE name = 'App mobile Mura'), 'Ancien plan v0 (abandonné)', 'Première version du cahier des charges, remplacée.', 'A_FAIRE', '2026-05-01', '2026-05-15', true);

-- Conférence annuelle (Événement, à venir)
INSERT INTO tasks (id, project_id, name, description, status, start_date, end_date, archived) VALUES
    ('00000000-0000-0000-0004-000000000001', (SELECT id FROM projects WHERE name = 'Conférence annuelle'), 'Réserver la salle', 'Choix et réservation du lieu de la conférence.', 'A_FAIRE', '2026-10-01', '2026-10-10', false),
    ('00000000-0000-0000-0004-000000000002', (SELECT id FROM projects WHERE name = 'Conférence annuelle'), 'Contacter les intervenants', 'Sollicitation et confirmation des speakers.', 'A_FAIRE', '2026-10-05', '2026-10-30', false),
    ('00000000-0000-0000-0004-000000000003', (SELECT id FROM projects WHERE name = 'Conférence annuelle'), 'Définir le programme', 'Agenda des sessions et des pauses.', 'A_FAIRE', '2026-10-15', '2026-11-05', false),
    ('00000000-0000-0000-0004-000000000004', (SELECT id FROM projects WHERE name = 'Conférence annuelle'), 'Organiser la logistique', 'Traiteur, badges et signalétique sur place.', 'A_FAIRE', '2026-11-01', '2026-11-18', false),
    ('00000000-0000-0000-0004-000000000005', (SELECT id FROM projects WHERE name = 'Conférence annuelle'), 'Ancienne date annulée', 'Créneau initial repoussé.', 'A_FAIRE', '2026-09-01', '2026-09-10', true);

-- Subtasks: a mix of fully-done, partially-done (blocks validation) and empty.
INSERT INTO subtasks (task_id, name, done) VALUES
    ('00000000-0000-0000-0001-000000000001', 'Auditer les pages clés', true),
    ('00000000-0000-0000-0001-000000000001', 'Lister les points de friction', true),
    ('00000000-0000-0000-0001-000000000003', 'Wireframe page d''accueil', true),
    ('00000000-0000-0000-0001-000000000003', 'Wireframe page contact', true),
    ('00000000-0000-0000-0001-000000000004', 'Maquette page d''accueil', true),
    ('00000000-0000-0000-0001-000000000004', 'Maquette page contact', false),
    ('00000000-0000-0000-0001-000000000005', 'Wireframe écran de login', false),

    ('00000000-0000-0000-0002-000000000001', 'Choisir le ton éditorial', true),
    ('00000000-0000-0000-0002-000000000001', 'Lister les thèmes récurrents', true),
    ('00000000-0000-0000-0002-000000000002', 'Visuel Instagram', true),
    ('00000000-0000-0000-0002-000000000002', 'Visuel LinkedIn', false),

    ('00000000-0000-0000-0003-000000000002', 'Prototype écran d''accueil', true),
    ('00000000-0000-0000-0003-000000000002', 'Prototype écran de profil', true),
    ('00000000-0000-0000-0003-000000000005', 'Soumission App Store', true),
    ('00000000-0000-0000-0003-000000000005', 'Soumission Play Store', true),

    ('00000000-0000-0000-0004-000000000002', 'Confirmer 3 speakers principaux', false);
