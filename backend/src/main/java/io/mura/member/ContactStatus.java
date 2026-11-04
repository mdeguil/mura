package io.mura.member;

/** Where a carnet entry stands between the two people it joins. */
public enum ContactStatus {
    /**
     * Asked for, not yet answered. In neither carnet, but the person who
     * asked can see they asked.
     */
    PENDING,
    /** Agreed to, and mutual: each one is in the other's carnet. */
    ACCEPTED,
    /**
     * Turned down. Asking again is allowed -- people change their minds --
     * which is why the row is kept rather than deleted.
     */
    DECLINED
}
