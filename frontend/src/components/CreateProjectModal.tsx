import { useState } from 'react'
import api from '../services/api'
import type { Project, ProjectType } from '../types'
import { projectGlassBackground } from '../utils/color'
import { PROJECT_TYPE_LABELS } from '../utils/projectMeta'

const COLORS = ['#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#22c55e']
const TYPES = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]

export default function CreateProjectModal({
    onClose,
    onCreated,
}: {
    onClose: () => void
    onCreated: (project: Project) => void
}) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState(COLORS[0])
    const [type, setType] = useState<ProjectType>('AUTRE')
    const [startDate, setStartDate] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data } = await api.post<Project>('/projects', {
                name,
                description,
                color,
                type,
                startDate: startDate || null,
            })
            onCreated(data)
            onClose()
        } catch {
            setError("Impossible de créer le projet. Réessaie.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-lg">
                <h2 className="text-base font-semibold text-slate-800 mb-4">Créer un projet</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Mon nouveau projet"
                            required
                            maxLength={255}
                            autoFocus
                            className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as ProjectType)}
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                            >
                                {TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {PROJECT_TYPE_LABELS[t]}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Date de début</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Description (optionnel)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="De quoi parle ce projet ?"
                            rows={2}
                            maxLength={2000}
                            className="w-full rounded-lg border border-border-strong bg-surface-muted px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Couleur</label>
                        <div className="flex gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    style={{ background: projectGlassBackground(c) }}
                                    className={`w-7 h-7 rounded-full transition ${
                                        color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                                    }`}
                                    aria-label={c}
                                />
                            ))}
                        </div>
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
                            className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                        >
                            {loading ? 'Création…' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
