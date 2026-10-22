-- V25__add_account_role.sql
-- A role on the account itself, distinct from project_members.role.
--
-- project_members.role (OWNER / ADMIN / MEMBER) says what someone may do
-- inside one project. This one says what they may do to the application:
-- see every account, change someone's account role, suspend an account.
-- The two never substitute for each other -- an application administrator
-- gets no rights at all on a project they are not a member of.

ALTER TABLE users
    ADD COLUMN account_role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Suspension rather than deletion: an account owns projects, tasks,
-- invitations and notifications, and removing it would take all of that
-- with it. A suspended account cannot sign in and its existing token stops
-- working, but everything it produced stays where it is.
ALTER TABLE users
    ADD COLUMN suspended_at TIMESTAMP;

ALTER TABLE users
    ADD CONSTRAINT chk_users_account_role CHECK (account_role IN ('ADMIN', 'USER'));

-- The fixture account that has carried the name all along.
UPDATE users SET account_role = 'ADMIN' WHERE email = 'admin@mura.dev';
