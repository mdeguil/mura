-- V30__group_hold_and_group_links.sql
-- Two things the gérant's own page needs.

-- A member can be set aside without being removed: someone on leave, or
-- between assignments, stays on the list and is left out when the group is
-- used to invite everybody.
--
-- This is not account suspension and must never be read as one. Suspending
-- an account is an administrator's doing and stops the person using Mura at
-- all; being on hold concerns this one group and nothing else.
ALTER TABLE user_group_members
    ADD COLUMN on_hold_at TIMESTAMP;

-- Notifications about a group carried its name but no way back to it, so a
-- line about a group you still belong to led nowhere. Carried the way
-- project_id is, and left null when the reader has nothing left to open.
--
-- SET NULL rather than CASCADE, unlike project_id: the news that a group was
-- deleted has to outlive the group it is about.
ALTER TABLE notifications
    ADD COLUMN group_id UUID REFERENCES user_groups(id) ON DELETE SET NULL;
