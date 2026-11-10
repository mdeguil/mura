import i18n from '../i18n'
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

/**
 * What each project status is called on screen, in the language shown
 * right now: each entry is read when the screen draws it.
 */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    get A_VENIR() {
        return i18n.t('projects.status.A_VENIR')
    },
    get EN_COURS() {
        return i18n.t('projects.status.EN_COURS')
    },
    get ACHEVE() {
        return i18n.t('projects.status.ACHEVE')
    },
}

/** The badge colours of each project status. */
export const PROJECT_STATUS_CLASSES: Record<ProjectStatus, string> = {
    A_VENIR: 'bg-slate-100 text-slate-600',
    EN_COURS: 'bg-blue-100 text-blue-700',
    ACHEVE: 'bg-emerald-100 text-emerald-700',
}
