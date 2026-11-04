import { useState } from 'react'
import api from '../services/api'
import UserAvatar, { SuspendedPill } from './UserAvatar'
import CarnetCombobox from './CarnetCombobox'
import ConfirmDialog from './ConfirmDialog'
import GroupAddPanel from './GroupAddPanel'
import MemberDepartureDialog, { type Departure } from './MemberDepartureDialog'
import type { Invitation, Member, ProjectRole } from '../types'
import { apiErrorMessage } from '../utils/apiError'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

const ROLE_LABELS: Record<ProjectRole, string> = {
    OWNER: 'Propriétaire',
    ADMIN: 'Administrateur',
    MEMBER: 'Membre',
}

export default function MemberList({
    projectId,
    members,
    invitations,
    canManage,
    isOwner,
    currentUserId,
    onInvited,
    onInvitationCancelled,
    onRemoved,
    onMembersChanged,
}: {
    projectId: string
    members: Member[]
    invitations: Invitation[]
    // Owner or admin: may invite, cancel an invitation, remove members.
    canManage: boolean
    // Owner only: may change roles and hand the project over.
    isOwner: boolean
    currentUserId: string
    onInvited: (invitation: Invitation) => void
    onInvitationCancelled: (invitationId: string) => void
    onRemoved: (memberId: string) => void
    onMembersChanged: (members: Member[]) => void
}) {
    const [inviting, setInviting] = useState(false)
    // One person is asked and answers; a group is brought straight in.
    const [mode, setMode] = useState<'person' | 'group'>('person')
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [successorId, setSuccessorId] = useState('')
    const [departure, setDeparture] = useState<Departure | null>(null)
    const [confirmingTransfer, setConfirmingTransfer] = useState(false)

    const pending = invitations.filter((i) => i.status === 'PENDING')
    // Refused or lapsed: either way nobody is coming, and either way the
    // answer is to ask again.
    const closed = invitations.filter((i) => i.status === 'DECLINED' || i.status === 'EXPIRED')
    const others = members.filter((m) => m.id !== currentUserId)
    const me = members.find((m) => m.id === currentUserId)



    function closeInvite() {
        setInviting(false)
        setMode('person')
        setEmail('')
        setError('')
    }

    // Whatever invitation the newcomers still had is gone on the server,
    // so it goes from the list here too.
    function handleGroupAdded(updated: Member[], joinedIds: string[]) {
        onMembersChanged(updated)
        invitations
            .filter((i) => joinedIds.includes(i.invitedUser.id))
            .forEach((i) => onInvitationCancelled(i.id))
        closeInvite()
    }

    async function invite(address: string) {
        setError('')
        setLoading(true)
        try {
            const { data } = await api.post<Invitation>(`/projects/${projectId}/invitations`, {
                email: address,
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

    async function handleRoleChange(member: Member, role: ProjectRole) {
        setError('')
        try {
            const { data } = await api.patch<Member>(
                `/projects/${projectId}/members/${member.id}/role`,
                { role }
            )
            onMembersChanged(members.map((m) => (m.id === data.id ? data : m)))
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de changer ce rôle.'))
        }
    }

    async function handleTransfer() {
        setError('')
        try {
            const { data } = await api.post<Member[]>(
                `/projects/${projectId}/members/${successorId}/transfer-ownership`
            )
            onMembersChanged(data)
            setSuccessorId('')
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de céder le projet.'))
        }
        setConfirmingTransfer(false)
    }

    const successor = members.find((m) => m.id === successorId)

    return (
        <section className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-semibold text-slate-800">
                    Équipe <span className="text-slate-400 font-normal">{members.length}</span>
                </h2>
                {canManage && (
                    <button
                        onClick={() => (inviting ? closeInvite() : setInviting(true))}
                        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition ${
                            inviting
                                ? 'bg-surface-muted text-slate-500 rotate-45'
                                : 'bg-brand-500 text-ink hover:bg-brand-600'
                        }`}
                        title={inviting ? 'Annuler' : 'Inviter une personne ou ajouter un groupe'}
                        aria-label={inviting ? 'Annuler' : 'Inviter une personne ou ajouter un groupe'}
                        aria-expanded={inviting}
                    >
                        {/* Drawn rather than typed: the + glyph sits off the
                            optical centre of a round button, and this one also
                            has to rotate cleanly into a ✕. */}
                        <svg
                            viewBox="0 0 16 16"
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            aria-hidden="true"
                        >
                            <path d="M8 3.5v9M3.5 8h9" />
                        </svg>
                    </button>
                )}
            </div>

            {inviting && (
                <div className="flex items-center gap-1 mb-3 w-fit bg-surface-muted border border-border rounded-lg p-0.5">
                    {(
                        [
                            ['person', 'Une personne'],
                            ['group', 'Un groupe'],
                        ] as const
                    ).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => {
                                setMode(key)
                                setError('')
                            }}
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
            )}

            {inviting && mode === 'group' && (
                <GroupAddPanel
                    projectId={projectId}
                    members={members}
                    onAdded={handleGroupAdded}
                    onCancel={closeInvite}
                />
            )}

            {inviting && mode === 'person' && (
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        if (email.trim()) invite(email.trim())
                    }}
                    className="mb-4"
                >
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Qui veux-tu inviter ?
                    </label>
                    <div className="flex gap-2">
                        {/* Typing a name searches the carnet; typing an
                            address invites somebody who is not in it yet. */}
                        <CarnetCombobox
                            className="flex-1 min-w-0"
                            value={email}
                            onChange={setEmail}
                            onPick={(person) => person.email && invite(person.email)}
                            onEscape={closeInvite}
                            autoFocus
                            placeholder="Un nom du carnet, ou prenom@exemple.com"
                            // Already on the team, or already asked: offering
                            // either would be offering a click that fails.
                            excludeIds={[
                                ...members.map((m) => m.id),
                                ...pending.map((i) => i.invitedUser.id),
                            ]}
                        />
                        <button
                            type="submit"
                            disabled={loading || !email.trim()}
                            className="h-9 px-3 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-xs font-medium transition disabled:opacity-60 shrink-0"
                        >
                            {loading ? 'Envoi…' : 'Inviter'}
                        </button>
                    </div>
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
                            <p className="text-sm text-slate-700 truncate flex items-center gap-1.5">
                                <span className="truncate">{member.username}</span>
                                {member.id === currentUserId && <span className="text-slate-400"> · toi</span>}
                                {member.suspended && <SuspendedPill />}
                            </p>
                            {member.email && (
                                <p className="text-xs text-slate-400 truncate">{member.email}</p>
                            )}
                        </div>

                        {member.role === 'OWNER' ? (
                            <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full shrink-0">
                                {ROLE_LABELS.OWNER}
                            </span>
                        ) : isOwner ? (
                            <select
                                value={member.role}
                                onChange={(e) => handleRoleChange(member, e.target.value as ProjectRole)}
                                className="h-7 rounded-lg border border-border-strong bg-surface-muted px-1.5 text-xs text-slate-600 outline-none focus:border-brand-500 transition shrink-0"
                                aria-label={`Rôle de ${member.username}`}
                            >
                                <option value="MEMBER">{ROLE_LABELS.MEMBER}</option>
                                <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                            </select>
                        ) : (
                            <span className="text-xs text-slate-400 shrink-0">
                                {ROLE_LABELS[member.role]}
                            </span>
                        )}

                        {member.role !== 'OWNER' && canManage && member.id !== currentUserId && (
                            <button
                                onClick={() => setDeparture({ member, leaving: false })}
                                className="text-slate-300 hover:text-red-500 transition text-xs leading-none shrink-0"
                                title={`Retirer ${member.username} du projet`}
                                aria-label={`Retirer ${member.username} du projet`}
                            >
                                ✕
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {/* Invited but not yet on the team: kept apart from the members so
                the two are never read as the same thing. */}
            {pending.length > 0 && (
                <div className="mt-5 pt-4 border-t border-dashed border-border-strong">
                    <h3 className="text-xs font-medium text-slate-500 mb-2">
                        En attente de réponse ({pending.length})
                    </h3>
                    <ul className="flex flex-col gap-2">
                        {pending.map((invitation) => (
                            <li key={invitation.id} className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full border border-dashed border-border-strong flex items-center justify-center text-xs text-slate-400 shrink-0">
                                    {invitation.invitedUser.username[0]?.toUpperCase()}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-slate-500 truncate">
                                        {invitation.invitedUser.email ?? invitation.invitedUser.username}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        Expire{' '}
                                        {formatDistanceToNow(new Date(invitation.expiresAt), {
                                            addSuffix: true,
                                            locale: fr,
                                        })}
                                    </p>
                                </div>
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
            {/* Neither a refusal nor a lapse is a dead end: asking again
                replaces the old invitation. */}
            {closed.length > 0 && canManage && (
                <div className="mt-5 pt-4 border-t border-dashed border-border-strong">
                    <h3 className="text-xs font-medium text-slate-500 mb-2">
                        Restées sans suite ({closed.length})
                    </h3>
                    <ul className="flex flex-col gap-2">
                        {closed.map((invitation) => (
                            <li key={invitation.id} className="flex items-center gap-3">
                                <span className="w-7 h-7 rounded-full bg-surface-muted flex items-center justify-center text-xs text-slate-400 shrink-0">
                                    {invitation.invitedUser.username[0]?.toUpperCase()}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-slate-400 truncate">
                                        {invitation.invitedUser.email ?? invitation.invitedUser.username}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {invitation.status === 'DECLINED' ? 'A refusé' : 'Invitation expirée'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => invitation.invitedUser.email && invite(invitation.invitedUser.email)}
                                    disabled={loading}
                                    className="text-xs text-brand-600 hover:text-brand-700 transition shrink-0 disabled:opacity-60"
                                >
                                    Réinviter
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {isOwner && others.length > 0 && (
                <div className="mt-5 pt-4 border-t border-border">
                    <h3 className="text-xs font-medium text-slate-500 mb-2">Céder le projet</h3>
                    <div className="flex gap-2">
                        <select
                            value={successorId}
                            onChange={(e) => setSuccessorId(e.target.value)}
                            className="flex-1 min-w-0 h-8 rounded-lg border border-border-strong bg-surface-muted px-2 text-xs text-slate-600 outline-none focus:border-brand-500 transition"
                            aria-label="Nouveau propriétaire"
                        >
                            <option value="">Choisir une personne…</option>
                            {others.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.username}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => setConfirmingTransfer(true)}
                            disabled={!successor}
                            className="h-8 px-3 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-brand-500 transition disabled:opacity-40 shrink-0"
                        >
                            Céder
                        </button>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5">
                        Tu deviendras administrateur et pourras ensuite quitter le projet.
                    </p>
                </div>
            )}

            {/* Showing yourself out deserves a button of its own: a cross on
                your own row read as "remove me" without saying so. */}
            {me && me.role !== 'OWNER' && (
                <div className="mt-5 pt-4 border-t border-border">
                    <button
                        onClick={() => setDeparture({ member: me, leaving: true })}
                        className="h-8 px-3 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-red-400 hover:text-red-600 transition"
                    >
                        Quitter le projet
                    </button>
                </div>
            )}

            {/* Irreversible from this side: only the new owner can hand it back. */}
            {confirmingTransfer && successor && (
                <ConfirmDialog
                    title={`Céder le projet à ${successor.username} ?`}
                    body={`Tu deviendras administrateur, et seul ${successor.username} pourra te le rendre.`}
                    confirmLabel="Céder le projet"
                    tone="neutral"
                    onCancel={() => setConfirmingTransfer(false)}
                    onConfirm={handleTransfer}
                />
            )}

            {departure && (
                <MemberDepartureDialog
                    projectId={projectId}
                    departure={departure}
                    onClose={() => setDeparture(null)}
                    onDone={(memberId) => {
                        setDeparture(null)
                        onRemoved(memberId)
                    }}
                />
            )}
        </section>
    )
}
