-- V2__seed_test_users.sql
-- Test accounts for local development. Password for all: "password123"

INSERT INTO users (email, username, password) VALUES
    ('alice@mura.dev', 'alice', '$2a$10$XxBRy1En00tJ6zJRYNJOB.IFy6XDniEcbtpvGJfvWABRiGJue1yVG'),
    ('bob@mura.dev',   'bob',   '$2a$10$XxBRy1En00tJ6zJRYNJOB.IFy6XDniEcbtpvGJfvWABRiGJue1yVG'),
    ('admin@mura.dev', 'admin', '$2a$10$XxBRy1En00tJ6zJRYNJOB.IFy6XDniEcbtpvGJfvWABRiGJue1yVG');
