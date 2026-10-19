package io.mura.project;

// How much of a project the caller may see: a member works on it, while
// someone merely invited can read its description and decide.
public enum ProjectAccess {
    MEMBER,
    INVITED
}
