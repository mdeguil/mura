-- V29__project_types_table.sql
-- The five types were a Java enum, so adding one meant a release. They are
-- rows now, and an administrator owns them.

CREATE TABLE project_types (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label      VARCHAR(50)  NOT NULL,
    emoji      VARCHAR(16)  NOT NULL,
    position   INTEGER      NOT NULL DEFAULT 0,
    -- Exactly one type is the fallback. Deleting any other moves its
    -- projects here, which is why this one cannot itself be deleted.
    fallback   BOOLEAN      NOT NULL DEFAULT false,
    created_at TIMESTAMP    NOT NULL DEFAULT now()
);

-- Two types called the same thing would be indistinguishable in the picker.
CREATE UNIQUE INDEX uq_project_types_label ON project_types (lower(label));

-- One fallback, enforced rather than trusted: the delete path has nowhere
-- to send projects if there are none, and no answer if there are two.
CREATE UNIQUE INDEX uq_project_types_fallback ON project_types (fallback) WHERE fallback;

INSERT INTO project_types (label, emoji, position, fallback) VALUES
    ('Web',        '🌐', 1, false),
    ('Mobile',     '📱', 2, false),
    ('Marketing',  '📣', 3, false),
    ('Événement',  '🎉', 4, false),
    ('Autre',      '📁', 5, true);

ALTER TABLE projects ADD COLUMN type_id UUID REFERENCES project_types(id);

-- The old column held the enum name; the new rows are keyed by their label.
UPDATE projects p SET type_id = t.id
FROM project_types t
WHERE t.label = CASE p.type
    WHEN 'WEB'       THEN 'Web'
    WHEN 'MOBILE'    THEN 'Mobile'
    WHEN 'MARKETING' THEN 'Marketing'
    WHEN 'EVENEMENT' THEN 'Événement'
    ELSE 'Autre'
END;

ALTER TABLE projects ALTER COLUMN type_id SET NOT NULL;
ALTER TABLE projects DROP COLUMN type;
