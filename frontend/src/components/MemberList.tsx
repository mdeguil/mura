import { useState } from 'react'
import api from '../services/api'
import AddToggleButton from './AddToggleButton'
import CarnetAddForm from './CarnetAddForm'
import ErrorMessage from './ErrorMessage'
import GroupAddPanel from './GroupAddPanel'
import MemberDepartureDialog, { type Departure } from './MemberDepartureDialog'
import ProjectInvitationList from './ProjectInvitationList'
import ProjectMemberRow from './ProjectMemberRow'
import TransferOwnership from './TransferOwnership'
import type { Invitation, Member, ProjectRole } from '../types'
import { apiErrorMessage } from '../utils/apiError'

// The team of a project, the people invited onto it, and what the reader's
// role lets them do about either.
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
    const [error, setError] = useState('')
    const [sending, setSending] = useState(false)
    const [departure, setDeparture] = useState<Departure | null>(null)

    const pendingIds = invitations.filter((i) => i.status === 'PENDING').map((i) => i.invitedUser.id)
    const others = members.filter((m) => m.id !== currentUserId)
    const me = members.find((m) => m.id === currentUserId)

    function closeInvite() {
        setInviting(false)
        setMode('person')
        setError('')
    }

    // Runs a change to the team, saying so here if it fails. Answers
    // whether it went through.
    async function attempt(action: () => Promise<void>, fallback: string): Promise<boolean> {
        setError('')
        try {
            await action()
            return true
        } catch (err) {
            setError(apiErrorMessage(err, fallback))
            return false
        }
    }

    // Whatever invitation the newcomers still had is gone on the server,
    // so it goes from the list here too.
    function handleGroupAdded(updated: Member[], joinedIds: string[]) {
        onMembersChanged(updated)
        invitations.filter((i) => joinedIds.includes(i.invitedUser.id)).forEach((i) => onInvitationCancelled(i.id))
        closeInvite()
    }

    async function invite(address: string) {
        setSending(true)
        const sent = await attempt(async () => {
            const { data } = await api.post<Invitation>(`/projects/${projectId}/invitations`, { email: address })
            onInvited(data)
        }, "Impossible d'inviter cette personne.")
        setSending(false)
        if (sent) closeInvite()
    }

    function cancelInvitation(invitation: Invitation) {
        void attempt(async () => {
            await api.delete(`/projects/${projectId}/invitations/${invitation.id}`)
            onInvitationCancelled(invitation.id)
        }, "Impossible d'annuler cette invitation.")
    }

    function changeRole(member: Member, role: ProjectRole) {
        void attempt(async () => {
            const { data } = await api.patch<Member>(`/projects/${projectId}/members/${member.id}/role`, { role })
            onMembersChanged(members.map((m) => (m.id === data.id ? data : m)))
        }, 'Impossible de changer ce rôle.')
    }

    function transfer(successor: Member) {
        return attempt(async () => {
            const { data } = await api.post<Member[]>(
                `/projects/${projectId}/members/${successor.id}/transfer-ownership`
            )
            onMembersChanged(data)
        }, 'Impossible de céder le projet.')
    }

    return (
        <section className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-sm font-semibold text-slate-800">
                    Équipe <span className="text-slate-400 font-normal">{members.length}</span>
                </h2>
                {canManage && (
                    <AddToggleButton
                        open={inviting}
                        label="Inviter une personne ou ajouter un groupe"
                        onClick={() => (inviting ? closeInvite() : setInviting(true))}
                    />
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
                            aria-pressed={mode === key}
                            className={`h-7 px-3 rounded-md text-xs font-medium transition ${
                                mode === key ? 'bg-surface text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {inviting && mode === 'group' && (
                <GroupAddPanel projectId={projectId} members={members} onAdded={handleGroupAdded} onCancel={closeInvite} />
            )}

            {inviting && mode === 'person' && (
                <CarnetAddForm
                    label="Qui veux-tu inviter ?"
                    submitLabel="Inviter"
                    busyLabel="Envoi…"
                    busy={sending}
                    // Already on the team, or already asked: offering either
                    // would be offering a click that fails.
                    excludeIds={[...members.map((m) => m.id), ...pendingIds]}
                    onSubmit={invite}
                    onEscape={closeInvite}
                />
            )}

            {error && <ErrorMessage className="mb-4">{error}</ErrorMessage>}

            <ul className="flex flex-col divide-y divide-border">
                {members.map((member) => (
                    <ProjectMemberRow
                        key={member.id}
                        member={member}
                        isMe={member.id === currentUserId}
                        isOwner={isOwner}
                        canManage={canManage}
                        onRoleChange={(role) => changeRole(member, role)}
                        onRemove={() => setDeparture({ member, leaving: false })}
                    />
                ))}
            </ul>

            <ProjectInvitationList
                invitations={invitations}
                canManage={canManage}
                busy={sending}
                onCancel={cancelInvitation}
                onReinvite={invite}
            />

            {isOwner && others.length > 0 && <TransferOwnership candidates={others} onTransfer={transfer} />}

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
