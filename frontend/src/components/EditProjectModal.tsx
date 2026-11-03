import { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import type { Project, ProjectStatus } from '../types'
import { projectGlassBackground } from '../utils/color'
import { PROJECT_STATUS_LABELS } from '../utils/projectMeta'
import ProjectFormFields, { ColorPicker, FIELD, LABEL, type ProjectFormValues } from './ProjectFormFields'

const STATUSES = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]

export default function EditProjectModal({
    project,
    onClose,
    onSaved,
}: {
    project: Project
    onClose: () => void
    onSaved: (project: Project) => void
}) {
    const [values, setValues] = useState<ProjectFormValues>({
        name: project.name,
        description: project.description ?? '',
        color: project.color,
        typeId: project.type.id,
        startDate: project.startDate ?? '',
    })
    const [status, setStatus] = useState<ProjectStatus>(project.status)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const patch = (p: Partial<ProjectFormValues>) => setValues((prev) => ({ ...prev, ...p }))

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data } = await api.put<Project>(`/projects/${project.id}`, {
                ...values,
                startDate: values.startDate || null,
                status,
            })
            onSaved(data)
            onClose()
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible d’enregistrer ces changements.'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl shadow-lg max-h-[90vh] flex flex-col overflow-hidden">
                <span
                    className="h-1.5 shrink-0"
                    style={{ background: projectGlassBackground(values.color) }}
                />

                <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
                    <h2 className="text-base font-semibold text-slate-800">Modifier le projet</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Ces informations sont celles que voit toute l’équipe.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
                    <div className="px-6 py-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                        <div className="flex flex-col gap-5">
                            <ProjectFormFields values={values} onChange={patch} autoFocus />
                        </div>

                        <div className="flex flex-col gap-5">
                            <ColorPicker color={values.color} onChange={(color) => patch({ color })} />

                            <div>
                                <label className={LABEL}>Statut</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                                    className={FIELD}
                                >
                                    {STATUSES.map((s) => (
                                        <option key={s} value={s}>
                                            {PROJECT_STATUS_LABELS[s]}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-border bg-surface-muted/60 flex items-center justify-between gap-4 shrink-0">
                        <p className="text-xs text-red-500 min-w-0">{error}</p>
                        <div className="flex gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface transition"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="h-9 px-4 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                            >
                                {loading ? 'Enregistrement…' : 'Enregistrer'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
