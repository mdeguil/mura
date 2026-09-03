-- V4__rename_board_to_project.sql
-- Renames the board concept to project across tables, columns and indexes.

ALTER TABLE boards RENAME TO projects;
ALTER TABLE board_members RENAME TO project_members;
ALTER TABLE project_members RENAME COLUMN board_id TO project_id;
ALTER TABLE lists RENAME COLUMN board_id TO project_id;
ALTER TABLE labels RENAME COLUMN board_id TO project_id;

ALTER INDEX idx_lists_board_id RENAME TO idx_lists_project_id;
ALTER INDEX idx_board_members_user RENAME TO idx_project_members_user;
