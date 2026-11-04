import type { ProjectStatus } from '../types'

/**
 * A project type as it reads on screen. A type carries its own emoji and
 * label, so there is nothing left to look up -- and nothing to go stale
 * when an administrator adds one.
 *
 * @param type the type, or anything with its emoji and label
 * @returns the emoji followed by the label
 */
export function projectTypeLabel(type: { emoji: string; label: string }): string {
    return `${type.emoji} ${type.label}`
}

/** What each project status is called on screen. */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    A_VENIR: 'À venir',
    EN_COURS: 'En cours',
    ACHEVE: 'Achevé',
}

/** The badge colours of each project status. */
export const PROJECT_STATUS_CLASSES: Record<ProjectStatus, string> = {
    A_VENIR: 'bg-slate-100 text-slate-600',
    EN_COURS: 'bg-blue-100 text-blue-700',
    ACHEVE: 'bg-emerald-100 text-emerald-700',
}
