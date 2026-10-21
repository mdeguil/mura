-- V22__add_contact_hidden.sql
-- Removing someone from the carnet only worked for people put there on
-- purpose. Anyone arriving through a shared project could not be taken out,
-- because the carnet would rebuild them on the next read. A row marked
-- hidden is how the carnet remembers that decision.

ALTER TABLE contacts ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT false;
