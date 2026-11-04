import { useState } from 'react'
import api from '../services/api'
import DeleteProjectDialog from './DeleteProjectDialog'
import { apiErrorMessage } from '../utils/apiError'
import type { Project } from '../types'
import { projectGlassBackground } from '../utils/color'
import { projectTypeLabel } from '../utils/projectMeta'

/**
 * The owner's bin: archived projects, each with Restaurer and Supprimer.
 * Rows rather than cards: these are projects you are deciding about, not
 * ones you are working in, and the two actions matter more than the look.
 *
 * @param props the projects and what to do once one is restored or deleted
 */
export default function ArchivedProjectList({
    projects,
    onRestored,
    onDeleted,
}: {
    /** The archived projects to list. */
    projects: Project[]
    /** Called with the project once the server has restored it. */
    onRestored: (project: Project) => void
    /** Called with the project's id once the server has deleted it. */
    onDeleted: (projectId: string) => void
}) {
    const [error, setError] = useState('')
    const [busy, setBusy] = useState<string | null>(null)
    const [deleting, setDeleting] = useState<Project | null>(null)

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

    if (projects.length === 0) {
        return (
            <div className="bg-surface border border-border rounded-xl px-5 py-8 text-center">
                <p className="text-sm text-slate-500">Aucun projet archivé.</p>
                <p className="text-xs text-slate-400 mt-1">
                    Les projets que tu archives atterrissent ici, et rien n’en est perdu tant que tu ne
                    les supprimes pas.
                </p>
            </div>
        )
    }

    return (
        <>
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <ul className="flex flex-col gap-2">
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
                            <p className="text-xs text-slate-400">{projectTypeLabel(project.type)}</p>
                        </div>
                        <button
                            onClick={() => restore(project)}
                            disabled={busy === project.id}
                            className="h-8 px-3 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-brand-500 transition disabled:opacity-60 shrink-0"
                        >
                            Restaurer
                        </button>
                        <button
                            onClick={() => setDeleting(project)}
                            disabled={busy === project.id}
                            className="h-8 px-3 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition disabled:opacity-60 shrink-0"
                        >
                            Supprimer
                        </button>
                    </li>
                ))}
            </ul>

            {deleting && (
                <DeleteProjectDialog
                    project={deleting}
                    onClose={() => setDeleting(null)}
                    onDeleted={() => {
                        onDeleted(deleting.id)
                        setDeleting(null)
                    }}
                />
            )}
        </>
    )
}
