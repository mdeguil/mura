import { useTranslation } from 'react-i18next'
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
    const { t } = useTranslation()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function confirm() {
        setError('')
        setLoading(true)
        try {
            await api.patch(`/projects/${project.id}/archive`)
            onArchived()
        } catch (err) {
            setError(apiErrorMessage(err, t('archiveProject.failed')))
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
                    {t('archiveProject.title', { name: project.name })}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                    {t('archiveProject.subtitle')}
                </p>
            </div>

            <div className="px-6 py-5">
                <ul className="flex flex-col gap-2 text-sm text-slate-600">
                    <li className="flex gap-2">
                        <span className="text-emerald-600">✓</span>
                        {t('archiveProject.kept')}
                    </li>
                    <li className="flex gap-2">
                        <span className="text-emerald-600">✓</span>
                        {t('archiveProject.restore')}
                    </li>
                    <li className="flex gap-2">
                        <span className="text-slate-400">·</span>
                        {t('archiveProject.hidden')}
                    </li>
                </ul>

                {error && <p className="text-xs text-red-500 mt-4">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-border bg-surface-muted/60 flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface transition"
                >
                    {t('common.cancel')}
                </button>
                <button
                    onClick={confirm}
                    disabled={loading}
                    className="h-9 px-4 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium transition disabled:opacity-60"
                >
                    {loading ? t('archiveProject.submitting') : t('archiveProject.submit')}
                </button>
            </div>
        </Modal>
    )
}
