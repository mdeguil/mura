-- V23__add_contact_favourite.sql
-- Favourites: the handful of people you work with constantly, kept at the
-- top of the carnet and filterable on their own.

ALTER TABLE contacts ADD COLUMN favourite BOOLEAN NOT NULL DEFAULT false;
