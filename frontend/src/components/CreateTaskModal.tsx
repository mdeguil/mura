import { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import AssigneePicker from './AssigneePicker'
import type { Member, Task } from '../types'
import Modal from './Modal'

/**
 * The form that creates a task: name, dates, responsable and description.
 *
 * @param props the project, its team, and what to do once it is created
 */
export default function CreateTaskModal({
    projectId,
    members,
    onClose,
    onCreated,
}: {
    /** The project the task belongs to. */
    projectId: string
    /** Its team, to pick a responsable from. */
    members: Member[]
    /** Closes the form without creating anything. */
    onClose: () => void
    /** Called with the task once the server has created it. */
    onCreated: (task: Task) => void
}) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [assigneeId, setAssigneeId] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (endDate < startDate) {
            setError('La date de fin doit être après la date de début.')
            return
        }

        setLoading(true)
        try {
            const { data } = await api.post<Task>(`/projects/${projectId}/tasks`, {
                name,
                description,
                startDate,
                endDate,
                assigneeId,
            })
            onCreated(data)
            onClose()
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de créer la tâche. Réessaie.'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal labelledBy="create-task-title" onClose={onClose} size="sm" className="p-6">
            <h2 id="create-task-title" className="text-base font-semibold text-slate-800 mb-4">Nouvelle tâche</h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Maquettes desktop"
                        required
                        maxLength={255}
                        autoFocus
                        className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Début</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                            className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Fin</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            required
                            className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Responsable (optionnel)</label>
                    <AssigneePicker members={members} value={assigneeId} onChange={setAssigneeId} fullWidth />
                </div>

                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Description (optionnel)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Détails de la tâche"
                        rows={2}
                        maxLength={2000}
                        className="w-full rounded-lg border border-border-strong bg-surface-muted px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition resize-none"
                    />
                </div>

                {error && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                )}

                <div className="flex justify-end gap-2 mt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface-muted transition"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="h-9 px-4 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                    >
                        {loading ? 'Création…' : 'Créer'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
