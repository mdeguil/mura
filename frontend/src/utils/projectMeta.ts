import type { ProjectStatus } from '../types'

// A type now carries its own emoji and label, so there is nothing left to
// look up -- and nothing to go stale when an administrator adds one.
export function projectTypeLabel(type: { emoji: string; label: string }): string {
    return `${type.emoji} ${type.label}`
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    A_VENIR: 'À venir',
    EN_COURS: 'En cours',
    ACHEVE: 'Achevé',
}

export const PROJECT_STATUS_CLASSES: Record<ProjectStatus, string> = {
    A_VENIR: 'bg-slate-100 text-slate-600',
    EN_COURS: 'bg-blue-100 text-blue-700',
    ACHEVE: 'bg-emerald-100 text-emerald-700',
}
