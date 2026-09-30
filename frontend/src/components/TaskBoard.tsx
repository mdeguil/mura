import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Task, TaskStatus } from '../types'
import {
    adjacentTaskStatuses,
    TASK_STATUS_ICON_ACTIVE_CLASSES,
    TASK_STATUS_ICONS,
    TASK_STATUS_LABELS,
    TASK_STATUSES,
} from '../utils/taskMeta'

export default function TaskBoard({
    tasks,
    onStatusChange,
    onDelete,
}: {
    tasks: Task[]
    onStatusChange: (taskId: string, status: TaskStatus) => void
    onDelete: (taskId: string) => void
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TASK_STATUSES.map((status) => {
                const columnTasks = tasks.filter((t) => t.status === status)
                return (
                    <div key={status} className="bg-surface-muted border border-border rounded-xl p-3">
                        <h3 className="text-xs font-medium text-slate-500 mb-3">
                            {TASK_STATUS_LABELS[status]} ({columnTasks.length})
                        </h3>
                        <div className="flex flex-col gap-2">
                            {columnTasks.map((task) => (
                                <div key={task.id} className="bg-surface border border-border rounded-lg p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm text-slate-800 font-medium">{task.name}</p>
                                        <button
                                            onClick={() => onDelete(task.id)}
                                            className="text-slate-400 hover:text-red-500 transition text-xs leading-none shrink-0"
                                            aria-label="Supprimer la tâche"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {format(new Date(task.startDate), 'dd/MM', { locale: fr })} → {format(new Date(task.endDate), 'dd/MM/yyyy', { locale: fr })}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-2">
                                        {adjacentTaskStatuses(task.status).map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                disabled={s === task.status}
                                                onClick={() => onStatusChange(task.id, s)}
                                                title={TASK_STATUS_LABELS[s]}
                                                aria-label={TASK_STATUS_LABELS[s]}
                                                aria-pressed={task.status === s}
                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs leading-none transition ${
                                                    task.status === s
                                                        ? `${TASK_STATUS_ICON_ACTIVE_CLASSES[s]} cursor-default`
                                                        : 'bg-surface-muted text-slate-400 hover:text-slate-600'
                                                }`}
                                            >
                                                {TASK_STATUS_ICONS[s]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {columnTasks.length === 0 && (
                                <p className="text-xs text-slate-400 italic">Aucune tâche</p>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
