-- V3__add_board_details.sql
-- Adds project-type, start date and status to boards.

ALTER TABLE boards
    ADD COLUMN type       VARCHAR(20) NOT NULL DEFAULT 'AUTRE',
    ADD COLUMN start_date DATE,
    ADD COLUMN status     VARCHAR(20) NOT NULL DEFAULT 'A_VENIR';
