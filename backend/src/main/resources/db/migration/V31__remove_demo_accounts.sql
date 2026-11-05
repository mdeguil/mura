-- V31__remove_demo_accounts.sql
-- The seeds since V2 put three demo accounts in every database, one of them
-- an administrator whose password is public. A real instance must not keep
-- them, so they go here, with everything they own (the foreign keys
-- cascade). A development database started with the dev profile keeps them:
-- that profile sets the demo placeholder to true.

DELETE FROM cards
WHERE created_by IN (SELECT id FROM users WHERE email IN ('alice@mura.dev', 'bob@mura.dev', 'admin@mura.dev'))
  AND '${demo}' <> 'true';

DELETE FROM users
WHERE email IN ('alice@mura.dev', 'bob@mura.dev', 'admin@mura.dev')
  AND '${demo}' <> 'true';
