import type { ProjectStatus, ProjectType } from '../types'

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
    WEB: '🌐 Web',
    MOBILE: '📱 Mobile',
    MARKETING: '📣 Marketing',
    EVENEMENT: '🎉 Événement',
    AUTRE: '📁 Autre',
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
    A_VENIR: 'À venir',
    EN_COURS: 'En cours',
    ACHEVE: 'Achevé',
}

export const PROJECT_STATUS_CLASSES: Record<ProjectStatus, string> = {
    A_VENIR: 'bg-slate-100 text-slate-600',
    EN_COURS: 'bg-amber-100 text-amber-700',
    ACHEVE: 'bg-emerald-100 text-emerald-700',
}
