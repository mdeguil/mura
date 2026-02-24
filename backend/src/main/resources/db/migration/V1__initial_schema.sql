-- V1__initial_schema.sql
-- Mura initial database schema

CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    avatar_url  VARCHAR(500),
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE boards (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    color       VARCHAR(7)   NOT NULL DEFAULT '#0079BF',
    owner_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE board_members (
    board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL DEFAULT 'MEMBER', -- OWNER, ADMIN, MEMBER
    joined_at   TIMESTAMP   NOT NULL DEFAULT now(),
    PRIMARY KEY (board_id, user_id)
);

CREATE TABLE lists (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    position    INTEGER NOT NULL DEFAULT 0,
    board_id    UUID    NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE labels (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100),
    color       VARCHAR(7) NOT NULL,
    board_id    UUID       NOT NULL REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE cards (
    id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    position    INTEGER NOT NULL DEFAULT 0,
    due_date    TIMESTAMP,
    list_id     UUID    NOT NULL REFERENCES lists(id)  ON DELETE CASCADE,
    created_by  UUID    NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE card_members (
    card_id     UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, user_id)
);

CREATE TABLE card_labels (
    card_id     UUID NOT NULL REFERENCES cards(id)  ON DELETE CASCADE,
    label_id    UUID NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, label_id)
);

-- Indexes
CREATE INDEX idx_lists_board_id    ON lists(board_id);
CREATE INDEX idx_cards_list_id     ON cards(list_id);
CREATE INDEX idx_board_members_user ON board_members(user_id);
