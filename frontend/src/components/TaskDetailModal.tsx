import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import api from '../services/api'
import type { Subtask, Task } from '../types'
import { TASK_STATUS_CLASSES, TASK_STATUS_LABELS } from '../utils/taskMeta'

export default function TaskDetailModal({
    task,
    projectId,
    onClose,
    onSubtaskAdded,
    onSubtaskToggled,
    onSubtaskDeleted,
}: {
    task: Task
    projectId: string
    onClose: () => void
    onSubtaskAdded: (taskId: string, subtask: Subtask) => void
    onSubtaskToggled: (taskId: string, subtask: Subtask) => void
    onSubtaskDeleted: (taskId: string, subtaskId: string) => void
}) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    const doneCount = task.subtasks.filter((s) => s.done).length

    async function handleAddSubtask(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        try {
            const { data } = await api.post<Subtask>(`/projects/${projectId}/tasks/${task.id}/subtasks`, { name })
            onSubtaskAdded(task.id, data)
            setName('')
        } finally {
            setLoading(false)
        }
    }

    async function handleToggle(subtask: Subtask) {
        const { data } = await api.patch<Subtask>(
            `/projects/${projectId}/tasks/${task.id}/subtasks/${subtask.id}/toggle`
        )
        onSubtaskToggled(task.id, data)
    }

    async function handleDelete(subtaskId: string) {
        await api.delete(`/projects/${projectId}/tasks/${task.id}/subtasks/${subtaskId}`)
        onSubtaskDeleted(task.id, subtaskId)
    }

    return (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-lg">
                <div className="flex items-start justify-between gap-4">
                    <h2 className="text-base font-semibold text-slate-800">{task.name}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition text-sm leading-none shrink-0"
                        aria-label="Fermer"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TASK_STATUS_CLASSES[task.status]}`}>
                        {TASK_STATUS_LABELS[task.status]}
                    </span>
                    <span className="text-xs text-slate-500">
                        {format(new Date(task.startDate), 'dd/MM/yyyy', { locale: fr })} → {format(new Date(task.endDate), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                </div>

                {task.description && (
                    <p className="text-sm text-slate-600 mt-4 whitespace-pre-wrap">{task.description}</p>
                )}

                <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="text-xs font-medium text-slate-500 mb-3">
                        Sous-tâches ({doneCount}/{task.subtasks.length})
                    </h3>

                    <div className="flex flex-col gap-1.5">
                        {task.subtasks.map((subtask) => (
                            <div key={subtask.id} className="flex items-center gap-2 group">
                                <input
                                    type="checkbox"
                                    checked={subtask.done}
                                    onChange={() => handleToggle(subtask)}
                                    className="w-4 h-4 rounded accent-brand-500 shrink-0"
                                />
                                <span
                                    className={`text-sm flex-1 ${subtask.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                                >
                                    {subtask.name}
                                </span>
                                <button
                                    onClick={() => handleDelete(subtask.id)}
                                    className="text-slate-300 hover:text-red-500 transition text-xs leading-none opacity-0 group-hover:opacity-100"
                                    aria-label="Supprimer la sous-tâche"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {task.subtasks.length === 0 && (
                            <p className="text-xs text-slate-400 italic">Aucune sous-tâche</p>
                        )}
                    </div>

                    <form onSubmit={handleAddSubtask} className="flex gap-2 mt-3">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ajouter une sous-tâche"
                            maxLength={255}
                            className="flex-1 h-8 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                        />
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-xs font-medium transition disabled:opacity-60"
                        >
                            + Ajouter
                        </button>
                    </form>

                    {task.subtasks.length > 0 && doneCount < task.subtasks.length && (
                        <p className="text-xs text-slate-400 mt-3">
                            Toutes les sous-tâches doivent être cochées avant de pouvoir valider cette tâche.
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
}
