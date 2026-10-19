import { useState } from 'react'
import api from '../services/api'
import type { Invitation } from '../types'
import { projectGlassBackground } from '../utils/color'

export default function InvitationInbox({
    invitations,
    onAnswered,
}: {
    invitations: Invitation[]
    // Accepting adds a project to the list, so the page reloads its projects
    // rather than guessing what the new one looks like.
    onAnswered: (invitationId: string, accepted: boolean) => void
}) {
    const [pending, setPending] = useState<string | null>(null)

    async function answer(invitation: Invitation, accepted: boolean) {
        setPending(invitation.id)
        try {
            await api.post(`/invitations/${invitation.id}/${accepted ? 'accept' : 'decline'}`)
            onAnswered(invitation.id, accepted)
        } finally {
            setPending(null)
        }
    }

    if (invitations.length === 0) return null

    return (
        <div className="mb-6 border border-brand-500/30 bg-brand-50/40 rounded-xl p-4">
            <h2 className="text-xs font-medium text-slate-600 mb-3">
                ✉ Invitations ({invitations.length})
            </h2>

            <div className="flex flex-col gap-2">
                {invitations.map((invitation) => (
                    <div
                        key={invitation.id}
                        className="flex items-center gap-3 bg-surface border border-border rounded-lg px-3 py-2"
                    >
                        <span
                            className="w-1.5 h-8 rounded-full shrink-0"
                            style={{ background: projectGlassBackground(invitation.projectColor) }}
                        />
                        <p className="text-sm text-slate-700 min-w-0 flex-1 truncate">
                            <span className="font-medium">{invitation.invitedBy.username}</span> t'invite à
                            rejoindre <span className="font-medium">{invitation.projectName}</span>
                        </p>
                        <button
                            onClick={() => answer(invitation, false)}
                            disabled={pending === invitation.id}
                            className="h-8 px-3 rounded-lg text-xs font-medium text-slate-600 hover:bg-surface-muted transition disabled:opacity-60 shrink-0"
                        >
                            Refuser
                        </button>
                        <button
                            onClick={() => answer(invitation, true)}
                            disabled={pending === invitation.id}
                            className="h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-xs font-medium transition disabled:opacity-60 shrink-0"
                        >
                            Accepter
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
