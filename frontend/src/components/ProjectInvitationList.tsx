import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Invitation } from '../types'

/**
 * The people asked to join who are not on the team: those still to answer,
 * kept apart from the members so the two are never read as the same thing,
 * and those who refused or let it lapse. Neither of the latter is a dead
 * end: asking again replaces the old invitation.
 *
 * @param props the invitations, what the viewer may do and what to do on each action
 */
export default function ProjectInvitationList({
    invitations,
    canManage,
    busy,
    onCancel,
    onReinvite,
}: {
    /** The project's invitations, whatever their status. */
    invitations: Invitation[]
    /** Whether the viewer may withdraw and resend them. */
    canManage: boolean
    /** An invitation is on its way: Réinviter waits for it. */
    busy: boolean
    /** Called with the pending invitation to withdraw. */
    onCancel: (invitation: Invitation) => void
    /** Called with the address to invite again. */
    onReinvite: (email: string) => void
}) {
    const pending = invitations.filter((i) => i.status === 'PENDING')
    const closed = invitations.filter((i) => i.status === 'DECLINED' || i.status === 'EXPIRED')

    return (
        <>
            {pending.length > 0 && (
                <div className="mt-5 pt-4 border-t border-dashed border-border-strong">
                    <h3 className="text-xs font-medium text-slate-500 mb-2">En attente de réponse ({pending.length})</h3>
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
                                        {formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true, locale: fr })}
                                    </p>
                                </div>
                                {canManage && (
                                    <button
                                        onClick={() => onCancel(invitation)}
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

            {closed.length > 0 && canManage && (
                <div className="mt-5 pt-4 border-t border-dashed border-border-strong">
                    <h3 className="text-xs font-medium text-slate-500 mb-2">Restées sans suite ({closed.length})</h3>
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
                                    onClick={() => invitation.invitedUser.email && onReinvite(invitation.invitedUser.email)}
                                    disabled={busy}
                                    className="text-xs text-brand-600 hover:text-brand-700 transition shrink-0 disabled:opacity-60"
                                >
                                    Réinviter
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    )
}
