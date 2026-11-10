import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import type { Project, ProjectStatus } from '../types'
import { projectGlassBackground } from '../utils/color'
import { PROJECT_STATUS_LABELS } from '../utils/projectMeta'
import ProjectFormFields, { ColorPicker, FIELD, LABEL, type ProjectFormValues } from './ProjectFormFields'
import Modal from './Modal'

const STATUSES = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]

/**
 * The form that edits a project's details and status, for its owner and
 * admins.
 *
 * @param props the project and what to do once it is saved
 */
export default function EditProjectModal({
    project,
    onClose,
    onSaved,
}: {
    /** The project as it stands. */
    project: Project
    /** Closes the form without saving. */
    onClose: () => void
    /** Called with the project as the server saved it. */
    onSaved: (project: Project) => void
}) {
    const { t } = useTranslation()
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
            setError(apiErrorMessage(err, t('projects.edit.failed')))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal labelledBy="edit-project-title" onClose={onClose} size="xl" className="max-h-[90vh] flex flex-col overflow-hidden">
            <span
                className="h-1.5 shrink-0"
                style={{ background: projectGlassBackground(values.color) }}
            />

            <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
                <h2 id="edit-project-title" className="text-base font-semibold text-slate-800">{t('projects.edit.title')}</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                    {t('projects.edit.subtitle')}
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
                            <label className={LABEL}>{t('projects.edit.status')}</label>
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
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-9 px-4 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                        >
                            {loading ? t('common.saving') : t('common.save')}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    )
}
