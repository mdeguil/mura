package io.mura.task;

/**
 * Where a task stands. A task only moves forward through these, one stage
 * at a time, and never back; {@link #TERMINE} is final.
 */
public enum TaskStatus {
    /** Not started. Where a task begins unless told otherwise. */
    A_FAIRE,
    /** Under way. */
    EN_COURS,
    /** Done. Reached only once every subtask is ticked off. */
    TERMINE
}
