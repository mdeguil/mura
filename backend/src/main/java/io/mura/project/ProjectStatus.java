package io.mura.project;

/**
 * Where a project's work stands. Set by hand by whoever runs the team; it
 * moves freely in any direction. Being archived is a separate matter.
 */
public enum ProjectStatus {
    /** Not started yet. Where every new project begins. */
    A_VENIR,
    /** Under way. */
    EN_COURS,
    /** Finished. Reaching it stamps the completion date. */
    ACHEVE
}
