import i18n from '../i18n'
import type { TaskStatus } from '../types'

/** The task statuses, in the order a task goes through them. */
export const TASK_STATUSES: TaskStatus[] = ['A_FAIRE', 'EN_COURS', 'TERMINE']

/**
 * What each task status is called on screen, in the language shown right
 * now: each entry is read when the screen draws it, not when this file
 * loads.
 */
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
    get A_FAIRE() {
        return i18n.t('tasks.status.A_FAIRE')
    },
    get EN_COURS() {
        return i18n.t('tasks.status.EN_COURS')
    },
    get TERMINE() {
        return i18n.t('tasks.status.TERMINE')
    },
}

/** The badge colours of each task status. */
export const TASK_STATUS_CLASSES: Record<TaskStatus, string> = {
    A_FAIRE: 'bg-slate-100 text-slate-600',
    EN_COURS: 'bg-blue-100 text-blue-700',
    TERMINE: 'bg-emerald-100 text-emerald-700',
}

/** The bar and dot colours of each task status, in the planning and the history. */
export const TASK_STATUS_BAR_CLASSES: Record<TaskStatus, string> = {
    A_FAIRE: 'bg-slate-400',
    EN_COURS: 'bg-blue-500',
    TERMINE: 'bg-emerald-500',
}

/** The symbol of each task status on the board's columns. */
export const TASK_STATUS_ICONS: Record<TaskStatus, string> = {
    A_FAIRE: '○',
    EN_COURS: '▶',
    TERMINE: '✓',
}

/** The colours of a column's symbol when it holds the task. */
export const TASK_STATUS_ICON_ACTIVE_CLASSES: Record<TaskStatus, string> = {
    A_FAIRE: 'bg-slate-400 text-white',
    EN_COURS: 'bg-blue-500 text-white',
    TERMINE: 'bg-emerald-500 text-white',
}

/**
 * The status a task moves to next. A task can only move forward through the
 * pipeline (À faire -> En cours -> Terminé), never backward and never
 * skipping a stage. Terminé has no next stage: it's final.
 */
export const NEXT_TASK_STATUS: Partial<Record<TaskStatus, TaskStatus>> = {
    A_FAIRE: 'EN_COURS',
    EN_COURS: 'TERMINE',
}

/**
 * The same colours as TASK_STATUS_BAR_CLASSES, as hex, because the card's
 * accent band is built by projectGlassBackground() rather than by a class.
 * slate-400, blue-500, emerald-500, as the light theme defines them in
 * index.css -- blue-500 being the charte's Bleu Océan scale.
 */
export const TASK_STATUS_HEX: Record<TaskStatus, string> = {
    A_FAIRE: '#94a3b8',
    EN_COURS: '#3a8ccf',
    TERMINE: '#10b981',
}

/**
 * The look of the button that advances a task, by the status it leads to.
 * It wears the colour of that state, so "mettre en cours" and "valider" are
 * told apart before they are read.
 */
export const TASK_ADVANCE_CLASSES: Record<TaskStatus, string> = {
    A_FAIRE: '',
    EN_COURS: 'border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white hover:border-blue-500',
    TERMINE: 'border border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500',
}

/**
 * The look of that button when the task cannot advance. Blocked is a
 * different shape as well as a different colour -- dashed, drained, and
 * plainly not the same object: on a 24-pixel control, two greys one step
 * apart is no difference at all.
 */
export const TASK_ADVANCE_BLOCKED = 'border border-dashed border-slate-300 bg-transparent text-slate-300 cursor-not-allowed'
