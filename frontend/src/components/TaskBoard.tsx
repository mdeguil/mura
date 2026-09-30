import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Task, TaskStatus } from '../types'
import {
    NEXT_TASK_STATUS,
    TASK_STATUS_ICON_ACTIVE_CLASSES,
    TASK_STATUS_ICONS,
    TASK_STATUS_LABELS,
    TASK_STATUSES,
} from '../utils/taskMeta'

export default function TaskBoard({
    tasks,
    archivedTasks,
    onStatusChange,
    onArchive,
    onRestore,
    onDeletePermanently,
}: {
    tasks: Task[]
    archivedTasks: Task[]
    onStatusChange: (taskId: string, status: TaskStatus) => void
    onArchive: (taskId: string) => void
    onRestore: (taskId: string) => void
    onDeletePermanently: (taskId: string) => void
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-surface-muted border border-border rounded-xl p-3">
                <h3 className="text-xs font-medium text-slate-500 mb-3">
                    Archivé ({archivedTasks.length})
                </h3>
                <div className="flex flex-col gap-2">
                    {archivedTasks.map((task) => (
                        <div key={task.id} className="bg-surface border border-border rounded-lg p-3">
                            <p className="text-sm text-slate-800 font-medium">{task.name}</p>
                            <p className="text-xs text-slate-500 mt-1">
                                {format(new Date(task.startDate), 'dd/MM', { locale: fr })} → {format(new Date(task.endDate), 'dd/MM/yyyy', { locale: fr })}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <button
                                    onClick={() => onRestore(task.id)}
                                    className="text-xs text-slate-500 hover:text-brand-600 transition"
                                    title="Restaurer"
                                >
                                    ↩ Restaurer
                                </button>
                                <button
                                    onClick={() => onDeletePermanently(task.id)}
                                    className="text-xs text-red-500 hover:text-red-700 transition"
                                    title="Supprimer définitivement"
                                >
                                    🗑 Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                    {archivedTasks.length === 0 && (
                        <p className="text-xs text-slate-400 italic">Aucune tâche archivée</p>
                    )}
                </div>
            </div>

            {TASK_STATUSES.map((status) => {
                const columnTasks = tasks.filter((t) => t.status === status)
                return (
                    <div key={status} className="bg-surface-muted border border-border rounded-xl p-3">
                        <h3 className="text-xs font-medium text-slate-500 mb-3">
                            {TASK_STATUS_LABELS[status]} ({columnTasks.length})
                        </h3>
                        <div className="flex flex-col gap-2">
                            {columnTasks.map((task) => (
                                <div key={task.id} className="bg-surface border border-border rounded-lg p-3 flex items-stretch gap-2">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-slate-800 font-medium">{task.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {format(new Date(task.startDate), 'dd/MM', { locale: fr })} → {format(new Date(task.endDate), 'dd/MM/yyyy', { locale: fr })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => onArchive(task.id)}
                                            className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-amber-600 transition text-xs leading-none"
                                            title="Archiver"
                                            aria-label="Archiver la tâche"
                                        >
                                            ✕
                                        </button>
                                        <div className="flex items-center gap-1.5">
                                            {NEXT_TASK_STATUS[status] ? (
                                                <button
                                                    type="button"
                                                    onClick={() => onStatusChange(task.id, NEXT_TASK_STATUS[status]!)}
                                                    title={`Passer ${TASK_STATUS_LABELS[NEXT_TASK_STATUS[status]!].toLowerCase()}`}
                                                    aria-label={`Passer ${TASK_STATUS_LABELS[NEXT_TASK_STATUS[status]!].toLowerCase()}`}
                                                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs leading-none transition bg-surface-muted text-slate-400 hover:text-slate-600"
                                                >
                                                    {TASK_STATUS_ICONS[NEXT_TASK_STATUS[status]!]}
                                                </button>
                                            ) : (
                                                <span
                                                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs leading-none ${TASK_STATUS_ICON_ACTIVE_CLASSES.TERMINE}`}
                                                    title="Terminé"
                                                    aria-label="Terminé"
                                                >
                                                    {TASK_STATUS_ICONS.TERMINE}
                                                </span>
                                            )}
                                        </div>
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
