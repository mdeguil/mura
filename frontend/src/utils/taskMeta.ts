import type { TaskStatus } from '../types'

export const TASK_STATUSES: TaskStatus[] = ['A_FAIRE', 'EN_COURS', 'TERMINE']

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    A_FAIRE: 'À faire',
    EN_COURS: 'En cours',
    TERMINE: 'Terminé',
}

export const TASK_STATUS_CLASSES: Record<TaskStatus, string> = {
    A_FAIRE: 'bg-slate-100 text-slate-600',
    EN_COURS: 'bg-blue-100 text-blue-700',
    TERMINE: 'bg-emerald-100 text-emerald-700',
}

export const TASK_STATUS_BAR_CLASSES: Record<TaskStatus, string> = {
    A_FAIRE: 'bg-slate-400',
    EN_COURS: 'bg-blue-500',
    TERMINE: 'bg-emerald-500',
}

export const TASK_STATUS_ICONS: Record<TaskStatus, string> = {
    A_FAIRE: '○',
    EN_COURS: '▶',
    TERMINE: '✓',
}

export const TASK_STATUS_ICON_ACTIVE_CLASSES: Record<TaskStatus, string> = {
    A_FAIRE: 'bg-slate-400 text-white',
    EN_COURS: 'bg-blue-500 text-white',
    TERMINE: 'bg-emerald-500 text-white',
}

// A task can only move forward through the pipeline (À faire -> En cours ->
// Terminé), never backward and never skipping a stage. Terminé has no next
// stage: it's final.
export const NEXT_TASK_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
    A_FAIRE: 'EN_COURS',
    EN_COURS: 'TERMINE',
}

// The same colours as TASK_STATUS_BAR_CLASSES, as hex, because the card's
// accent band is built by projectGlassBackground() rather than by a class.
// slate-400, blue-500, emerald-500.
export const TASK_STATUS_HEX: Record<TaskStatus, string> = {
    A_FAIRE: '#94a3b8',
    EN_COURS: '#3b82f6',
    TERMINE: '#10b981',
}

// The button that advances a task wears the colour of the state it leads
// to, so "mettre en cours" and "valider" are told apart before they are
// read. Blocked is a different shape as well as a different colour: on a
// 24-pixel control, two greys one step apart is no difference at all.
export const TASK_ADVANCE_CLASSES: Record<TaskStatus, string> = {
    A_FAIRE: '',
    EN_COURS: 'border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500',
    TERMINE: 'border border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500',
}

// Nothing to press: dashed, drained, and plainly not the same object.
export const TASK_ADVANCE_BLOCKED = 'border border-dashed border-slate-300 bg-transparent text-slate-300 cursor-not-allowed'
