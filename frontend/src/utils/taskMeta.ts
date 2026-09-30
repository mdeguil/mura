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

// A task can only move to an adjacent stage (À faire <-> En cours <-> Terminé),
// never jump straight from À faire to Terminé. At the two ends of the
// pipeline the current stage itself fills the second slot since there is
// no stage on that side.
export function adjacentTaskStatuses(current: TaskStatus): TaskStatus[] {
    const index = TASK_STATUSES.indexOf(current)
    if (index === 0) return [TASK_STATUSES[0], TASK_STATUSES[1]]
    if (index === TASK_STATUSES.length - 1) return [TASK_STATUSES[index - 1], TASK_STATUSES[index]]
    return [TASK_STATUSES[index - 1], TASK_STATUSES[index + 1]]
}
