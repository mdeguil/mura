import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import api from '../services/api'
import AssigneePicker from './AssigneePicker'
import Modal from './Modal'
import type { Member, Subtask, Task } from '../types'
import { apiErrorMessage } from '../utils/apiError'
import { TASK_STATUS_BAR_CLASSES, TASK_STATUS_CLASSES, TASK_STATUS_LABELS } from '../utils/taskMeta'

/**
 * The dialog of one task: its dates and responsable, edited in place, and
 * its subtasks, added, ticked and deleted from here.
 *
 * @param props the task, its project's team and what to do as it changes
 */
export default function TaskDetailModal({
    task,
    projectId,
    members,
    onClose,
    onSave,
    onSubtaskAdded,
    onSubtaskToggled,
    onSubtaskDeleted,
}: {
    /** The task shown. */
    task: Task
    /** The id of the project it belongs to. */
    projectId: string
    /** The project's team, to pick the responsable from. */
    members: Member[]
    /** Called to close the dialog. */
    onClose: () => void
    /** Saves the dates and the responsable; resolves to what went wrong, or `null` once saved. */
    onSave: (
        taskId: string,
        changes: { startDate: string; endDate: string; assigneeId: string | null }
    ) => Promise<string | null>
    /** Called with the task and the subtask just added to it. */
    onSubtaskAdded: (taskId: string, subtask: Subtask) => void
    /** Called with the task and the subtask just ticked or unticked. */
    onSubtaskToggled: (taskId: string, subtask: Subtask) => void
    /** Called with the task and the id of the subtask just deleted. */
    onSubtaskDeleted: (taskId: string, subtaskId: string) => void
}) {
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)

    const [start, setStart] = useState(task.startDate)
    const [end, setEnd] = useState(task.endDate)
    const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? null)
    const [dateError, setDateError] = useState('')
    const [savingDates, setSavingDates] = useState(false)
    const [subtaskError, setSubtaskError] = useState('')

    const doneCount = task.subtasks.filter((s) => s.done).length
    const createdAt = task.statusHistory.find((c) => c.fromStatus === null)?.changedAt
    const startedAt = task.statusHistory.find((c) => c.toStatus === 'EN_COURS')?.changedAt
    const finishedAt = task.statusHistory.find((c) => c.toStatus === 'TERMINE')?.changedAt

    const changed =
        start !== task.startDate ||
        end !== task.endDate ||
        assigneeId !== (task.assignee?.id ?? null)

    function editDates(nextStart: string, nextEnd: string) {
        setStart(nextStart)
        setEnd(nextEnd)
        setDateError('')
    }

    function discard() {
        setStart(task.startDate)
        setEnd(task.endDate)
        setAssigneeId(task.assignee?.id ?? null)
        setDateError('')
    }

    async function save(e: React.FormEvent) {
        e.preventDefault()

        if (!start || !end) {
            setDateError('Les deux dates sont requises.')
            return
        }
        if (end < start) {
            setDateError('La fin ne peut pas précéder le début.')
            return
        }

        setDateError('')
        setSavingDates(true)
        try {
            const problem = await onSave(task.id, { startDate: start, endDate: end, assigneeId })
            if (problem) {
                discard()
                setDateError(problem)
            }
        } finally {
            setSavingDates(false)
        }
    }

    async function subtaskChange(action: () => Promise<void>, fallback: string) {
        setSubtaskError('')
        try {
            await action()
        } catch (err) {
            setSubtaskError(apiErrorMessage(err, fallback))
        }
    }

    async function handleAddSubtask(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        setLoading(true)
        await subtaskChange(async () => {
            const { data } = await api.post<Subtask>(`/projects/${projectId}/tasks/${task.id}/subtasks`, { name })
            onSubtaskAdded(task.id, data)
            setName('')
        }, "Impossible d'ajouter cette sous-tâche.")
        setLoading(false)
    }

    function handleToggle(subtask: Subtask) {
        void subtaskChange(async () => {
            const { data } = await api.patch<Subtask>(
                `/projects/${projectId}/tasks/${task.id}/subtasks/${subtask.id}/toggle`
            )
            onSubtaskToggled(task.id, data)
        }, 'Impossible de cocher cette sous-tâche.')
    }

    function handleDelete(subtaskId: string) {
        void subtaskChange(async () => {
            await api.delete(`/projects/${projectId}/tasks/${task.id}/subtasks/${subtaskId}`)
            onSubtaskDeleted(task.id, subtaskId)
        }, 'Impossible de supprimer cette sous-tâche.')
    }

    return (
        <Modal labelledBy="task-detail-title" onClose={onClose} size="xl" className="p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
                <h2 id="task-detail-title" className="text-base font-semibold text-slate-800">{task.name}</h2>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 transition text-sm leading-none shrink-0"
                    aria-label="Fermer"
                >
                    ✕
                </button>
            </div>

            <form id="task-edit" onSubmit={save} noValidate className="flex flex-wrap items-end gap-3 mt-3">
                <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full mb-1.5 ${TASK_STATUS_CLASSES[task.status]}`}
                >
                    {TASK_STATUS_LABELS[task.status]}
                </span>

                <div>
                    <label htmlFor="task-start" className="block text-[11px] font-medium text-slate-500 mb-1">
                        Début
                    </label>
                    <input
                        id="task-start"
                        type="date"
                        value={start}
                        disabled={savingDates}
                        onChange={(e) => editDates(e.target.value, end)}
                        className="h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition disabled:opacity-60"
                    />
                </div>

                <span className="text-slate-400 mb-2">→</span>

                <div>
                    <label htmlFor="task-end" className="block text-[11px] font-medium text-slate-500 mb-1">
                        Fin
                    </label>
                    <input
                        id="task-end"
                        type="date"
                        value={end}
                        disabled={savingDates}
                        min={start}
                        onChange={(e) => editDates(start, e.target.value)}
                        className="h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition disabled:opacity-60"
                    />
                </div>
            </form>

            {dateError && (
                <p role="alert" className="text-xs text-red-600 mt-2">
                    {dateError}
                </p>
            )}
            <div className="flex items-center gap-2 mt-3">
                <span className="text-xs font-medium text-slate-500">Responsable</span>
                <AssigneePicker
                    members={members}
                    value={assigneeId}
                    onChange={(next) => setAssigneeId(next)}
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

                {subtaskError && (
                    <p role="alert" className="text-xs text-red-600 mt-3">
                        {subtaskError}
                    </p>
                )}

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
                        className="h-8 px-3 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-xs font-medium transition disabled:opacity-60"
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

            <div className="flex items-center gap-2 mt-6 pt-4 border-t border-border">
                <button
                    type="submit"
                    form="task-edit"
                    disabled={savingDates || !changed}
                    className="h-9 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-ink text-xs font-medium transition disabled:opacity-40"
                >
                    {savingDates ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                    type="button"
                    onClick={discard}
                    disabled={savingDates || !changed}
                    className="h-9 px-4 rounded-lg text-xs font-medium text-slate-500 hover:bg-surface-muted transition disabled:opacity-40"
                >
                    Annuler
                </button>
                {changed && !dateError && (
                    <span className="text-xs text-slate-400">Modifications non enregistrées</span>
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
        </Modal>
    )
}
