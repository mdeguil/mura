import { useTranslation } from 'react-i18next'
import { useCallback, useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import { anchoredStyle, useAnchoredMenu } from '../hooks/useAnchoredMenu'
import type { KnownUser, Project } from '../types'

/**
 * The menu that invites a person of the carnet onto one of the reader's
 * projects. Inviting someone used to mean opening the project, finding the
 * Infos tab and typing an address you already have in front of you. From
 * the carnet the address is the one thing we do not need to ask for.
 *
 * @param props the person, the reader's projects and the reader's id
 */
export default function ProjectInviteMenu({
    person,
    projects,
    currentUserId,
}: {
    /** The person to invite. */
    person: KnownUser
    /**
     * Everything the reader can see; the ones they may invite to are worked
     * out here rather than by the caller.
     */
    projects: Project[]
    /** The reader's account id. */
    currentUserId: string
}) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState<string | null>(null)
    const [error, setError] = useState('')
    const [invited, setInvited] = useState<string[]>([])
    const close = useCallback(() => setOpen(false), [])
    const { wrapper, trigger, position } = useAnchoredMenu({ open, onClose: close, minWidth: 248 })

    const invitable = projects.filter((project) => {
        if (project.archived) return false
        const mine = project.members.find((m) => m.id === currentUserId)
        return mine?.role === 'OWNER' || mine?.role === 'ADMIN'
    })

    async function invite(project: Project) {
        if (!person.email) return

        setError('')
        setBusy(project.id)
        try {
            await api.post(`/projects/${project.id}/invitations`, { email: person.email })
            setInvited((prev) => [...prev, project.id])
        } catch (err) {
            setError(apiErrorMessage(err, t('projects.inviteMenu.failed')))
        } finally {
            setBusy(null)
        }
    }

    if (invitable.length === 0 || !person.email) return null

    return (
        <div ref={wrapper} className="inline-flex">
            <button
                ref={trigger}
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                title={t('projects.inviteMenu.title')}
                aria-label={t('projects.inviteMenu.label', { name: person.username })}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <svg
                    viewBox="0 0 24 24"
                    className="w-[18px] h-[18px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
                    <path d="M12 11v5" />
                    <path d="M9.5 13.5h5" />
                </svg>
            </button>

            {open && position && (
                <div
                    role="listbox"
                    style={anchoredStyle(position)}
                    className="overflow-y-auto bg-surface border border-border rounded-xl shadow-lg p-1.5 z-50 flex flex-col gap-1"
                >
                    <p className="text-[11px] text-slate-400 px-2 pt-1 pb-1.5">
                        {t('projects.inviteMenu.heading', { name: person.username })}
                    </p>

                    {invitable.map((project) => {
                        const already = project.members.some((m) => m.id === person.id)
                        const sent = invited.includes(project.id)

                        return (
                            <button
                                key={project.id}
                                type="button"
                                role="option"
                                aria-selected={already || sent}
                                disabled={already || sent || busy === project.id}
                                onClick={() => invite(project)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-surface-muted transition disabled:hover:bg-transparent disabled:cursor-default"
                            >
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: project.color }}
                                    aria-hidden="true"
                                />
                                <span className="text-xs text-slate-700 truncate flex-1">
                                    {project.name}
                                </span>
                                <span className="text-[10px] shrink-0">
                                    {already ? (
                                        <span className="text-slate-400">{t('projects.inviteMenu.alreadyMember')}</span>
                                    ) : sent ? (
                                        <span className="text-emerald-600">{t('projects.inviteMenu.invited')}</span>
                                    ) : busy === project.id ? (
                                        <span className="text-slate-400">…</span>
                                    ) : null}
                                </span>
                            </button>
                        )
                    })}

                    {error && <p className="text-[11px] text-red-500 px-2 py-1">{error}</p>}
                </div>
            )}
        </div>
    )
}
