import type { TaskStatus } from '../types'

export const TASK_STATUSES: TaskStatus[] = ['A_FAIRE', 'EN_COURS', 'TERMINE']

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    A_FAIRE: 'À faire',
    EN_COURS: 'En cours',
    TERMINE: 'Terminé',
}

export const TASK_STATUS_CLASSES: Record<TaskStatus, string> = {
    A_FAIRE: 'bg-slate-100 text-slate-600',
    EN_COURS: 'bg-amber-100 text-amber-700',
    TERMINE: 'bg-emerald-100 text-emerald-700',
}

export const TASK_STATUS_BAR_CLASSES: Record<TaskStatus, string> = {
    A_FAIRE: 'bg-slate-400',
    EN_COURS: 'bg-amber-500',
    TERMINE: 'bg-emerald-500',
}

export const TASK_STATUS_ICONS: Record<TaskStatus, string> = {
    A_FAIRE: '○',
    EN_COURS: '▶',
    TERMINE: '✓',
}

export const TASK_STATUS_ICON_ACTIVE_CLASSES: Record<TaskStatus, string> = {
    A_FAIRE: 'bg-slate-400 text-white',
    EN_COURS: 'bg-amber-500 text-white',
    TERMINE: 'bg-emerald-500 text-white',
}

// A task can only move forward through the pipeline (À faire -> En cours ->
// Terminé), never backward and never skipping a stage. Terminé has no next
// stage: it's final.
export const NEXT_TASK_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
    A_FAIRE: 'EN_COURS',
    EN_COURS: 'TERMINE',
}
