-- V21__create_user_groups.sql
-- Groups: a named set of people you work with, kept once instead of being
-- rebuilt project by project. A group grants no access on its own — it is a
-- shortcut for inviting, not a way around invitations.

-- Named user_groups rather than groups: GROUPS is a keyword in SQL, and a
-- table whose name has to be quoted everywhere is a trap for later.
CREATE TABLE user_groups (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL,
    owner_id   UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE TABLE user_group_members (
    group_id  UUID      NOT NULL REFERENCES user_groups(id) ON DELETE CASCADE,
    user_id   UUID      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP NOT NULL DEFAULT now(),
    PRIMARY KEY (group_id, user_id)
);

CREATE INDEX idx_user_group_members_user ON user_group_members(user_id);
