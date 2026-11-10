import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { dateLocale } from '../utils/dates'
import UserAvatar from './UserAvatar'
import type { Task, TaskStatus } from '../types'
import {
    NEXT_TASK_STATUS,
    TASK_ADVANCE_BLOCKED,
    TASK_ADVANCE_CLASSES,
    TASK_STATUS_HEX,
    TASK_STATUS_ICON_ACTIVE_CLASSES,
    TASK_STATUS_ICONS,
    TASK_STATUS_LABELS,
    TASK_STATUSES,
} from '../utils/taskMeta'
import { projectGlassBackground } from '../utils/color'

/**
 * The Tâches tab of a project: one column for the archived tasks, then one
 * per status, each card moving on to the next status, being archived,
 * restored or deleted for good.
 *
 * @param props the tasks and what to do on each action
 */
export default function TaskBoard({
    tasks,
    archivedTasks,
    onStatusChange,
    onArchive,
    onRestore,
    onDeletePermanently,
    onOpenTask,
}: {
    /** The live tasks, spread over the status columns. */
    tasks: Task[]
    /** The archived tasks, in a column of their own. */
    archivedTasks: Task[]
    /** Called with a task and the status it moves to. */
    onStatusChange: (taskId: string, status: TaskStatus) => void
    /** Called with the id of a task to archive. */
    onArchive: (taskId: string) => void
    /** Called with the id of an archived task to bring back. */
    onRestore: (taskId: string) => void
    /** Called with the id of an archived task to delete for good. */
    onDeletePermanently: (taskId: string) => void
    /** Called with the task whose card was opened. */
    onOpenTask: (task: Task) => void
}) {
    const { t } = useTranslation()
    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-surface-muted border border-border rounded-xl p-3">
                <h3 className="text-xs font-medium text-slate-500 mb-3">
                    {t('board.archived', { count: archivedTasks.length })}
                </h3>
                <div className="flex flex-col gap-2">
                    {archivedTasks.map((task) => (
                        <div key={task.id} className="bg-surface border border-border rounded-lg p-3 hover:border-brand-500 transition">
                            <p className="text-sm text-slate-800 font-medium">{task.name}</p>
                            <p className="text-xs text-slate-500 mt-1">
                                {format(new Date(task.startDate), 'dd/MM', { locale: dateLocale() })} → {format(new Date(task.endDate), 'dd/MM/yyyy', { locale: dateLocale() })}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <button
                                    onClick={() => onRestore(task.id)}
                                    className="text-xs text-slate-500 hover:text-brand-600 transition"
                                    title={t('board.restore')}
                                >
                                    {t('board.restoreAction')}
                                </button>
                                <button
                                    onClick={() => onDeletePermanently(task.id)}
                                    className="text-xs text-red-500 hover:text-red-700 transition"
                                    title={t('board.deleteForever')}
                                >
                                    {t('board.deleteAction')}
                                </button>
                            </div>
                        </div>
                    ))}
                    {archivedTasks.length === 0 && (
                        <p className="text-xs text-slate-400 italic">{t('board.noArchived')}</p>
                    )}
                </div>
            </div>

            {TASK_STATUSES.map((status) => {
                const columnTasks = tasks.filter((t) => t.status === status)
                return (
                    <div key={status} className="bg-surface-muted border border-border rounded-xl p-3">
                        <h3 className="text-xs font-medium text-slate-500 mb-3">
                            {t('board.column', { status: TASK_STATUS_LABELS[status], count: columnTasks.length })}
                        </h3>
                        <div className="flex flex-col gap-2">
                            {columnTasks.map((task) => {
                                const doneCount = task.subtasks.filter((s) => s.done).length
                                const hasIncompleteSubtasks = task.subtasks.length > 0 && doneCount < task.subtasks.length
                                const next = NEXT_TASK_STATUS[status]
                                const blockedByStatus = next === 'TERMINE' && hasIncompleteSubtasks

                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => onOpenTask(task)}
                                        className="relative overflow-hidden bg-surface border border-border rounded-lg p-3 pb-6 flex items-stretch gap-2 cursor-pointer hover:border-brand-500 transition"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-800 font-medium">{task.name}</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                {format(new Date(task.startDate), 'dd/MM', { locale: dateLocale() })} → {format(new Date(task.endDate), 'dd/MM/yyyy', { locale: dateLocale() })}
                                            </p>
                                            {task.subtasks.length > 0 && (
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {t('board.subtasks', { done: doneCount, total: task.subtasks.length })}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1.5 mt-2">
                                                {task.assignee ? (
                                                    <>
                                                        <UserAvatar user={task.assignee} size="sm" />
                                                        <span className="text-xs text-slate-500 truncate">
                                                            {task.assignee.username}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-slate-300 italic">{t('board.unassigned')}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div
                                            className="flex flex-col items-center gap-1 shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={() => onArchive(task.id)}
                                                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-600 transition text-xs leading-none"
                                                title={t('board.archive')}
                                                aria-label={t('board.archiveTask')}
                                            >
                                                ✕
                                            </button>
                                            <div className="flex items-center gap-1.5">
                                                {next ? (
                                                    <button
                                                        type="button"
                                                        disabled={blockedByStatus}
                                                        onClick={() => onStatusChange(task.id, next)}
                                                        title={
                                                            blockedByStatus
                                                                ? t('board.finishSubtasks')
                                                                : t(`board.advance.${next}`)
                                                        }
                                                        aria-label={t(`board.advance.${next}`)}
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs leading-none transition ${
                                                            blockedByStatus
                                                                ? TASK_ADVANCE_BLOCKED
                                                                : TASK_ADVANCE_CLASSES[next]
                                                        }`}
                                                    >
                                                        {TASK_STATUS_ICONS[next]}
                                                    </button>
                                                ) : (
                                                    <span
                                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs leading-none ${TASK_STATUS_ICON_ACTIVE_CLASSES.TERMINE}`}
                                                        title={t('board.finished')}
                                                        aria-label={t('board.finished')}
                                                    >
                                                        {TASK_STATUS_ICONS.TERMINE}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <span
                                            className="absolute inset-x-0 bottom-0 h-3 border-t border-white/40"
                                            style={{ background: projectGlassBackground(TASK_STATUS_HEX[task.status]) }}
                                            aria-hidden="true"
                                        />
                                    </div>
                                )
                            })}
                            {columnTasks.length === 0 && (
                                <p className="text-xs text-slate-400 italic">{t('board.empty')}</p>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
