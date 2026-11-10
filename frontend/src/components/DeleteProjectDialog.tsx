import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import type { Project } from '../types'
import Modal from './Modal'

/**
 * Deleting an archived project for good: the owner types its name back
 * before anything is done.
 *
 * @param props the project and what to do once it is deleted
 */
export default function DeleteProjectDialog({
    project,
    onClose,
    onDeleted,
}: {
    /** The archived project to delete. */
    project: Project
    /** Closes the dialog without deleting. */
    onClose: () => void
    /** Called once the server has deleted it. */
    onDeleted: () => void
}) {
    const { t } = useTranslation()
    const [typed, setTyped] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const matches = typed.trim() === project.name

    async function confirm() {
        if (!matches) return

        setError('')
        setLoading(true)
        try {
            await api.delete(`/projects/${project.id}`)
            onDeleted()
        } catch (err) {
            setError(apiErrorMessage(err, t('deleteProject.failed')))
            setLoading(false)
        }
    }

    return (
        <Modal labelledBy="delete-project-title" onClose={onClose} size="md" className="overflow-hidden">
            <span className="block h-1.5 bg-red-500" />

            <div className="px-6 pt-5 pb-4 border-b border-border">
                <h2 id="delete-project-title" className="text-base font-semibold text-slate-800">
                    {t('deleteProject.title', { name: project.name })}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                    {t('deleteProject.subtitle')}
                </p>
            </div>

            <div className="px-6 py-5">
                <p className="text-sm text-slate-600">{t('deleteProject.erased')}</p>
                <ul className="flex flex-col gap-1 mt-2 text-sm text-slate-600">
                    <li className="flex gap-2">
                        <span className="text-red-500">✕</span>
                        {t('deleteProject.tasks')}
                    </li>
                    <li className="flex gap-2">
                        <span className="text-red-500">✕</span>
                        {t('deleteProject.team')}
                    </li>
                </ul>

                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        confirm()
                    }}
                    className="mt-5"
                >
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        {t('deleteProject.typeName', { name: project.name })}
                    </label>
                    <input
                        type="text"
                        value={typed}
                        onChange={(e) => setTyped(e.target.value)}
                        autoFocus
                        className="w-full h-10 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 outline-none focus:border-red-400 transition"
                    />
                </form>

                {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
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
                    disabled={!matches || loading}
                    className="h-9 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-40 disabled:hover:bg-red-500"
                >
                    {loading ? t('deleteProject.submitting') : t('deleteProject.submit')}
                </button>
            </div>
        </Modal>
    )
}
