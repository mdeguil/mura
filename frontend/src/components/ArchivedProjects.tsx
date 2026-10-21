import { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import type { Project } from '../types'
import { projectGlassBackground } from '../utils/color'
import { PROJECT_TYPE_LABELS } from '../utils/projectMeta'

// The bin. Folded away by default: it is where projects go to be forgotten,
// not something to scroll past every time.
export default function ArchivedProjects({
    projects,
    onRestored,
    onDeleted,
}: {
    projects: Project[]
    onRestored: (project: Project) => void
    onDeleted: (projectId: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [error, setError] = useState('')
    const [busy, setBusy] = useState<string | null>(null)

    if (projects.length === 0) return null

    async function restore(project: Project) {
        setError('')
        setBusy(project.id)
        try {
            const { data } = await api.patch<Project>(`/projects/${project.id}/restore`)
            onRestored(data)
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de restaurer ce projet.'))
        } finally {
            setBusy(null)
        }
    }

    async function remove(project: Project) {
        // Everything inside goes with it, so the name has to be typed out.
        const typed = window.prompt(
            `Supprimer définitivement « ${project.name} » ?\n\nSes tâches, leur historique, son équipe et ses invitations seront effacés. Cette action est irréversible.\n\nTape le nom du projet pour confirmer :`
        )
        if (typed === null) return
        if (typed.trim() !== project.name) {
            setError('Le nom saisi ne correspond pas : rien n’a été supprimé.')
            return
        }

        setError('')
        setBusy(project.id)
        try {
            await api.delete(`/projects/${project.id}`)
            onDeleted(project.id)
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de supprimer ce projet.'))
        } finally {
            setBusy(null)
        }
    }

    return (
        <section className="mt-10 border-t border-border pt-5">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition"
                aria-expanded={open}
            >
                <span className={`text-xs transition-transform ${open ? 'rotate-90' : ''}`}>▶</span>
                Projets archivés <span className="text-slate-400">({projects.length})</span>
            </button>

            {open && (
                <>
                    {error && <p className="text-xs text-red-500 mt-3">{error}</p>}

                    <ul className="flex flex-col gap-2 mt-3">
                        {projects.map((project) => (
                            <li
                                key={project.id}
                                className="flex items-center gap-3 bg-surface border border-border rounded-lg px-3 py-2.5"
                            >
                                <span
                                    className="w-1.5 h-8 rounded-full shrink-0 opacity-50"
                                    style={{ background: projectGlassBackground(project.color) }}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-slate-600 truncate">{project.name}</p>
                                    <p className="text-xs text-slate-400">
                                        {PROJECT_TYPE_LABELS[project.type]}
                                    </p>
                                </div>
                                <button
                                    onClick={() => restore(project)}
                                    disabled={busy === project.id}
                                    className="h-8 px-3 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-brand-500 transition disabled:opacity-60 shrink-0"
                                >
                                    Restaurer
                                </button>
                                <button
                                    onClick={() => remove(project)}
                                    disabled={busy === project.id}
                                    className="h-8 px-3 rounded-lg text-xs text-red-500 hover:bg-red-50 transition disabled:opacity-60 shrink-0"
                                >
                                    Supprimer
                                </button>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    )
}
