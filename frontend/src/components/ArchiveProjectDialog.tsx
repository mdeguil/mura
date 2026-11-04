import { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import type { Project } from '../types'
import { projectGlassBackground } from '../utils/color'
import Modal from './Modal'

/**
 * Asks the owner to confirm putting a project in the bin, says what that
 * means, and archives it.
 *
 * @param props the project and what to do once it is archived or the dialog
 *        closes
 */
export default function ArchiveProjectDialog({
    project,
    onClose,
    onArchived,
}: {
    /** The project to archive. */
    project: Project
    /** Closes the dialog without archiving. */
    onClose: () => void
    /** Called once the server has archived it. */
    onArchived: () => void
}) {
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function confirm() {
        setError('')
        setLoading(true)
        try {
            await api.patch(`/projects/${project.id}/archive`)
            onArchived()
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible d’archiver ce projet.'))
            setLoading(false)
        }
    }

    return (
        <Modal labelledBy="archive-project-title" onClose={onClose} size="md" className="overflow-hidden">
            <span
                className="block h-1.5"
                style={{ background: projectGlassBackground(project.color) }}
            />

            <div className="px-6 pt-5 pb-4 border-b border-border">
                <h2 id="archive-project-title" className="text-base font-semibold text-slate-800">
                    Archiver « {project.name} » ?
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                    Le projet quitte la liste de toute l’équipe.
                </p>
            </div>

            <div className="px-6 py-5">
                {/* Said plainly, because the word "archiver" alone does not
                    tell anyone whether their work is about to disappear. */}
                <ul className="flex flex-col gap-2 text-sm text-slate-600">
                    <li className="flex gap-2">
                        <span className="text-emerald-600">✓</span>
                        Ses tâches, son planning et son équipe sont conservés.
                    </li>
                    <li className="flex gap-2">
                        <span className="text-emerald-600">✓</span>
                        Tu peux le restaurer quand tu veux depuis les projets archivés.
                    </li>
                    <li className="flex gap-2">
                        <span className="text-slate-400">·</span>
                        Les membres ne le verront plus dans leur liste.
                    </li>
                </ul>

                {error && <p className="text-xs text-red-500 mt-4">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-border bg-surface-muted/60 flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface transition"
                >
                    Annuler
                </button>
                <button
                    onClick={confirm}
                    disabled={loading}
                    className="h-9 px-4 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium transition disabled:opacity-60"
                >
                    {loading ? 'Archivage…' : 'Archiver le projet'}
                </button>
            </div>
        </Modal>
    )
}
