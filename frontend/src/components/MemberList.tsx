import { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import UserAvatar from './UserAvatar'
import type { Invitation, Member } from '../types'
import { apiErrorMessage } from '../utils/apiError'

export default function MemberList({
    projectId,
    members,
    invitations,
    canManage,
    currentUserId,
    onInvited,
    onInvitationCancelled,
    onRemoved,
}: {
    projectId: string
    members: Member[]
    invitations: Invitation[]
    canManage: boolean
    currentUserId: string
    onInvited: (invitation: Invitation) => void
    onInvitationCancelled: (invitationId: string) => void
    onRemoved: (memberId: string) => void
}) {
    const [inviting, setInviting] = useState(false)
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const emailField = useRef<HTMLInputElement>(null)

    // Opening the panel from the + should land the caret in the field: the
    // click and the typing are one gesture.
    useEffect(() => {
        if (inviting) emailField.current?.focus()
    }, [inviting])

    function closeInvite() {
        setInviting(false)
        setEmail('')
        setError('')
    }

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault()
        if (!email.trim()) return

        setError('')
        setLoading(true)
        try {
            const { data } = await api.post<Invitation>(`/projects/${projectId}/invitations`, {
                email: email.trim(),
            })
            onInvited(data)
            closeInvite()
        } catch (err) {
            setError(apiErrorMessage(err, "Impossible d'inviter cette personne."))
        } finally {
            setLoading(false)
        }
    }

    async function handleCancel(invitation: Invitation) {
        try {
            await api.delete(`/projects/${projectId}/invitations/${invitation.id}`)
            onInvitationCancelled(invitation.id)
        } catch (err) {
            setError(apiErrorMessage(err, "Impossible d'annuler cette invitation."))
        }
    }

    async function handleRemove(member: Member) {
        if (!window.confirm(`Retirer ${member.username} du projet ? Ses tâches resteront, sans responsable.`)) {
            return
        }

        try {
            await api.delete(`/projects/${projectId}/members/${member.id}`)
            onRemoved(member.id)
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de retirer ce membre.'))
        }
    }

    return (
        <section className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-semibold text-slate-800">
                    Équipe <span className="text-slate-400 font-normal">{members.length}</span>
                </h2>
                {canManage && (
                    <button
                        onClick={() => (inviting ? closeInvite() : setInviting(true))}
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-base leading-none transition ${
                            inviting
                                ? 'bg-surface-muted text-slate-500 rotate-45'
                                : 'bg-brand-500 text-white hover:bg-brand-600'
                        }`}
                        title={inviting ? 'Annuler' : 'Inviter une personne'}
                        aria-label={inviting ? 'Annuler' : 'Inviter une personne'}
                        aria-expanded={inviting}
                    >
                        +
                    </button>
                )}
            </div>

            {inviting && (
                <form onSubmit={handleInvite} className="mb-4">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Email de la personne à inviter
                    </label>
                    <div className="flex gap-2">
                        <input
                            ref={emailField}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && closeInvite()}
                            placeholder="prenom@exemple.com"
                            required
                            className="flex-1 min-w-0 h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                        />
                        <button
                            type="submit"
                            disabled={loading || !email.trim()}
                            className="h-9 px-3 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-xs font-medium transition disabled:opacity-60 shrink-0"
                        >
                            {loading ? 'Envoi…' : 'Inviter'}
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                        Elle rejoint le projet si elle accepte l'invitation.
                    </p>
                </form>
            )}

            {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                    {error}
                </p>
            )}

            <ul className="flex flex-col divide-y divide-border">
                {members.map((member) => (
                    <li key={member.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                        <UserAvatar user={member} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-700 truncate">
                                {member.username}
                                {member.id === currentUserId && <span className="text-slate-400"> · toi</span>}
                            </p>
                            {member.email && (
                                <p className="text-xs text-slate-400 truncate">{member.email}</p>
                            )}
                        </div>
                        {member.role === 'OWNER' ? (
                            <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full shrink-0">
                                Propriétaire
                            </span>
                        ) : (
                            <span className="text-xs text-slate-400 shrink-0">Membre</span>
                        )}
                        {member.role !== 'OWNER' && (canManage || member.id === currentUserId) && (
                            <button
                                onClick={() => handleRemove(member)}
                                className="text-slate-300 hover:text-red-500 transition text-xs leading-none shrink-0"
                                title={member.id === currentUserId ? 'Quitter le projet' : 'Retirer du projet'}
                                aria-label={member.id === currentUserId ? 'Quitter le projet' : 'Retirer du projet'}
                            >
                                ✕
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {/* Invited but not yet on the team: kept apart from the members so
                the two are never read as the same thing. */}
            {invitations.length > 0 && (
                <div className="mt-5 pt-4 border-t border-dashed border-border-strong">
                    <h3 className="text-xs font-medium text-slate-500 mb-2">
                        En attente de réponse ({invitations.length})
                    </h3>
                    <ul className="flex flex-col gap-2">
                        {invitations.map((invitation) => (
                            <li key={invitation.id} className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full border border-dashed border-border-strong flex items-center justify-center text-xs text-slate-400 shrink-0">
                                    {invitation.invitedUser.username[0]?.toUpperCase()}
                                </span>
                                <p className="text-sm text-slate-500 min-w-0 flex-1 truncate">
                                    {invitation.invitedUser.email ?? invitation.invitedUser.username}
                                </p>
                                {canManage && (
                                    <button
                                        onClick={() => handleCancel(invitation)}
                                        className="text-slate-300 hover:text-red-500 transition text-xs leading-none shrink-0"
                                        title="Annuler l'invitation"
                                        aria-label="Annuler l'invitation"
                                    >
                                        ✕
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </section>
    )
}
