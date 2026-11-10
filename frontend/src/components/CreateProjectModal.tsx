import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import CarnetCombobox from './CarnetCombobox'
import Modal from './Modal'
import GroupPicker, { type GroupSelection } from './GroupPicker'
import { useAuthStore } from '../store/authStore'
import type { Project } from '../types'
import { PROJECT_COLORS, projectGlassBackground } from '../utils/color'
import ProjectFormFields, {
    ColorPicker,
    LABEL,
    type ProjectFormValues,
} from './ProjectFormFields'

/**
 * The form that creates a project: its details, the people to invite, and
 * optionally one of the reader's groups to bring on whole.
 *
 * @param props what to do once it is created or the form closes
 */
export default function CreateProjectModal({
    onClose,
    onCreated,
}: {
    /** Closes the form without creating anything. */
    onClose: () => void
    /** Called with the project once the server has created it. */
    onCreated: (project: Project) => void
}) {
    const { t } = useTranslation()
    const [values, setValues] = useState<ProjectFormValues>({
        name: '',
        description: '',
        color: PROJECT_COLORS[0],
        typeId: '',
        startDate: '',
    })
    const [invited, setInvited] = useState<{ email: string; username?: string; id?: string }[]>([])
    const [emailDraft, setEmailDraft] = useState('')
    const [mode, setMode] = useState<'person' | 'group'>('person')
    const [fromGroup, setFromGroup] = useState<GroupSelection | null>(null)
    const currentUserId = useAuthStore((s) => s.user?.id) ?? ''
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const patch = (p: Partial<ProjectFormValues>) => setValues((prev) => ({ ...prev, ...p }))

    function addEmail() {
        const email = emailDraft.trim().toLowerCase()
        if (!email) return
        if (!email.includes('@')) {
            setError(t('createProject.notAnEmail', { email }))
            return
        }
        setError('')
        setEmailDraft('')
        add({ email })
    }

    function add(person: { email: string; username?: string; id?: string }) {
        setInvited((prev) =>
            prev.some((p) => p.email === person.email) ? prev : [...prev, person]
        )
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data } = await api.post<Project>('/projects', {
                ...values,
                startDate: values.startDate || null,
                invitedEmails: invited.map((p) => p.email),
                groupId: fromGroup?.groupId ?? null,
            })
            onCreated(data)
            onClose()
        } catch (err) {
            setError(apiErrorMessage(err, t('createProject.failed')))
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal labelledBy="create-project-title" onClose={onClose} size="xl" className="max-h-[90vh] flex flex-col overflow-hidden">
            <span
                className="h-1.5 shrink-0"
                style={{ background: projectGlassBackground(values.color) }}
            />

            <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
                <h2 id="create-project-title" className="text-base font-semibold text-slate-800">{t('createProject.title')}</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                    {t('createProject.subtitle')}
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
                            <label className={LABEL}>{t('createProject.team')}</label>

                            <div className="flex items-center gap-1 mb-2.5 w-fit bg-surface-muted border border-border rounded-lg p-0.5">
                                {(
                                    [
                                        ['person', t('createProject.person')],
                                        ['group', t('createProject.group')],
                                    ] as const
                                ).map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setMode(key)}
                                        className={`h-7 px-3 rounded-md text-xs font-medium transition ${
                                            mode === key
                                                ? 'bg-surface text-slate-800 shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div className={mode === 'group' ? '' : 'hidden'}>
                                <GroupPicker
                                    leftOut={(person) => (person.id === currentUserId ? t('createProject.you') : null)}
                                    allowNone
                                    countOnly
                                    onChange={setFromGroup}
                                />
                                <p className="text-xs text-slate-400 mt-2">
                                    {t('createProject.groupHint')}
                                </p>
                            </div>

                            <div className={mode === 'person' ? '' : 'hidden'}>
                                <div className="flex gap-2">
                                    <CarnetCombobox
                                        className="flex-1 min-w-0"
                                        value={emailDraft}
                                        onChange={setEmailDraft}
                                        onPick={(person) => {
                                            if (!person.email) return
                                            add({
                                                email: person.email.toLowerCase(),
                                                username: person.username,
                                                id: person.id,
                                            })
                                            setEmailDraft('')
                                        }}
                                        placeholder={t('people.addPlaceholder')}
                                        excludeEmails={invited.map((p) => p.email)}
                                    />
                                    <button
                                        type="button"
                                        onClick={addEmail}
                                        disabled={!emailDraft.trim()}
                                        className="w-10 h-10 rounded-lg bg-brand-500 hover:bg-brand-600 text-ink flex items-center justify-center transition disabled:opacity-40 shrink-0"
                                        aria-label={t('createProject.addPerson')}
                                    >
                                        <svg
                                            viewBox="0 0 16 16"
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M8 3.5v9M3.5 8h9" />
                                        </svg>
                                    </button>
                                </div>

                                {invited.length > 0 ? (
                                    <ul className="flex flex-wrap gap-1.5 mt-2.5">
                                        {invited.map((person) => (
                                            <li
                                                key={person.email}
                                                className="flex items-center gap-1.5 bg-surface-muted border border-border rounded-full pl-2.5 pr-1.5 py-1"
                                            >
                                                <span
                                                    className="text-xs text-slate-600"
                                                    title={person.email}
                                                >
                                                    {person.username ?? person.email}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setInvited((prev) =>
                                                            prev.filter((p) => p.email !== person.email)
                                                        )
                                                    }
                                                    className="text-slate-300 hover:text-red-500 transition text-xs leading-none"
                                                    aria-label={t('createProject.remove', { name: person.username ?? person.email })}
                                                >
                                                    ✕
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-slate-400 mt-2">
                                        {t('createProject.inviteHint')}
                                    </p>
                                )}
                            </div>

                            {mode === 'person' && fromGroup && (
                                <p className="text-xs text-slate-500 mt-2">
                                    {t('createProject.plusGroup', { name: fromGroup.groupName })}
                                </p>
                            )}
                            {mode === 'group' && invited.length > 0 && (
                                <p className="text-xs text-slate-500 mt-2">
                                    {t('createProject.plusPeople', { count: invited.length })}
                                </p>
                            )}
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
                            {loading ? t('createProject.submitting') : t('createProject.submit')}
                        </button>
                    </div>
                </div>
            </form>
        </Modal>
    )
}
