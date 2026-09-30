import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Task } from '../types'
import { TASK_STATUS_LABELS } from '../utils/taskMeta'

export default function ArchivedTasks({
    tasks,
    onRestore,
    onDelete,
}: {
    tasks: Task[]
    onRestore: (taskId: string) => void
    onDelete: (taskId: string) => void
}) {
    return (
        <div>
            <h3 className="text-xs font-medium text-slate-500 mb-3">Tâches archivées ({tasks.length})</h3>

            {tasks.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Aucune tâche archivée</p>
            ) : (
                <div className="flex flex-col gap-2">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className="flex items-center justify-between gap-3 bg-surface-muted border border-border rounded-lg px-3 py-2"
                        >
                            <div>
                                <p className="text-sm text-slate-600">{task.name}</p>
                                <p className="text-xs text-slate-400">
                                    {format(new Date(task.startDate), 'dd/MM', { locale: fr })} → {format(new Date(task.endDate), 'dd/MM/yyyy', { locale: fr })} · {TASK_STATUS_LABELS[task.status]}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <button
                                    onClick={() => onRestore(task.id)}
                                    className="text-xs text-slate-500 hover:text-brand-600 transition"
                                    title="Restaurer"
                                >
                                    ↩ Restaurer
                                </button>
                                <button
                                    onClick={() => onDelete(task.id)}
                                    className="text-xs text-red-500 hover:text-red-700 transition"
                                    title="Supprimer définitivement"
                                >
                                    🗑 Supprimer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
