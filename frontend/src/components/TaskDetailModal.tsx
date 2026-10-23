import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import api from '../services/api'
import AssigneePicker from './AssigneePicker'
import type { Member, Subtask, Task } from '../types'
import { TASK_STATUS_BAR_CLASSES, TASK_STATUS_CLASSES, TASK_STATUS_LABELS } from '../utils/taskMeta'

export default function TaskDetailModal({
    task,
    projectId,
    members,
    onClose,
    onAssigneeChange,
    onDatesChange,
    onSubtaskAdded,
    onSubtaskToggled,
    onSubtaskDeleted,
}: {
    task: Task
    projectId: string
    members: Member[]
    onClose: () => void
    onAssigneeChange: (taskId: string, assigneeId: string | null) => void
    onDatesChange: (taskId: string, startDate: string, endDate: string) => Promise<void>
    onSubtaskAdded: (taskId: string, subtask: Subtask) => void
    onSubtaskToggled: (taskId: string, subtask: Subtask) => void
    onSubtaskDeleted: (taskId: string, subtaskId: string) => void
}) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    // Edited in place, like the status badge and the responsable pill:
    // changing a date should not mean opening a form.
    const [editingDates, setEditingDates] = useState(false)
    const [start, setStart] = useState(task.startDate)
    const [end, setEnd] = useState(task.endDate)
    const [dateError, setDateError] = useState('')
    const [savingDates, setSavingDates] = useState(false)

    const doneCount = task.subtasks.filter((s) => s.done).length
    const createdAt = task.statusHistory.find((c) => c.fromStatus === null)?.changedAt
    const startedAt = task.statusHistory.find((c) => c.toStatus === 'EN_COURS')?.changedAt
    const finishedAt = task.statusHistory.find((c) => c.toStatus === 'TERMINE')?.changedAt

    function openDates() {
        setStart(task.startDate)
        setEnd(task.endDate)
        setDateError('')
        setEditingDates(true)
    }

    async function saveDates(e: React.FormEvent) {
        e.preventDefault()
        if (!start || !end) {
            setDateError('Les deux dates sont requises.')
            return
        }
        // Caught here rather than by the server, which would answer with a
        // less helpful message about the whole task.
        if (end < start) {
            setDateError('La fin ne peut pas précéder le début.')
            return
        }

        setDateError('')
        setSavingDates(true)
        try {
            await onDatesChange(task.id, start, end)
            setEditingDates(false)
        } finally {
            setSavingDates(false)
        }
    }

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
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-lg max-h-[85vh] overflow-y-auto">
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
                    {!editingDates && (
                        <button
                            onClick={openDates}
                            className="text-xs text-slate-500 hover:text-brand-600 transition flex items-center gap-1.5"
                            title="Modifier les dates"
                        >
                            {format(new Date(task.startDate), 'dd/MM/yyyy', { locale: fr })} →{' '}
                            {format(new Date(task.endDate), 'dd/MM/yyyy', { locale: fr })}
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none"
                                 stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                 strokeLinejoin="round" aria-hidden="true">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* noValidate on the form below is on purpose: min= greys out
                    the bad days in the picker, but it also makes the field
                    natively invalid once the start moves past the end, and the
                    browser would then block the submit with a tooltip of its
                    own instead of letting the form say it in French. */}
                {editingDates && (
                    <form onSubmit={saveDates} noValidate className="mt-3 flex flex-wrap items-end gap-2">
                        <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-1">Début</label>
                            <input
                                type="date"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                autoFocus
                                className="h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-slate-500 mb-1">Fin</label>
                            <input
                                type="date"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                // Nothing before the start is selectable, so the
                                // mistake is harder to make than to correct.
                                min={start}
                                className="h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={savingDates}
                            className="h-9 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition disabled:opacity-60"
                        >
                            {savingDates ? 'Enregistrement…' : 'Enregistrer'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditingDates(false)}
                            className="h-9 px-3 rounded-lg text-xs font-medium text-slate-500 hover:bg-surface-muted transition"
                        >
                            Annuler
                        </button>
                        {dateError && (
                            <p className="w-full text-xs text-red-500">{dateError}</p>
                        )}
                    </form>
                )}

                <div className="flex items-center gap-2 mt-3">
                    <span className="text-xs font-medium text-slate-500">Responsable</span>
                    <AssigneePicker
                        members={members}
                        value={task.assignee?.id ?? null}
                        onChange={(assigneeId) => onAssigneeChange(task.id, assigneeId)}
                    />
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

                <div className="mt-6 pt-6 border-t border-border">
                    <h3 className="text-xs font-medium text-slate-500 mb-3">Historique</h3>
                    <div className="flex flex-col gap-2">
                        {[
                            { label: 'Créée', date: createdAt, dotClass: TASK_STATUS_BAR_CLASSES.A_FAIRE },
                            { label: 'En cours', date: startedAt, dotClass: TASK_STATUS_BAR_CLASSES.EN_COURS },
                            { label: 'Terminé', date: finishedAt, dotClass: TASK_STATUS_BAR_CLASSES.TERMINE },
                        ]
                            .filter(({ date }) => date)
                            .map(({ label, date, dotClass }) => (
                                <div key={label} className="flex items-center gap-2 text-xs">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                                    <span className="text-slate-600">{label}</span>
                                    <span className="text-slate-400 ml-auto shrink-0">
                                        {format(new Date(date!), 'dd/MM/yyyy', { locale: fr })}
                                    </span>
                                </div>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
