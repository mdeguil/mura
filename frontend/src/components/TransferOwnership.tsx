import { useState } from 'react'
import ConfirmDialog from './ConfirmDialog'
import type { Member } from '../types'

// Handing the project to someone else on the team. Asked for twice, since
// it cannot be undone from this side: only the new owner can hand it back.
export default function TransferOwnership({
    candidates,
    onTransfer,
}: {
    // Everyone on the team but the owner.
    candidates: Member[]
    // Answers whether the project changed hands.
    onTransfer: (successor: Member) => Promise<boolean>
}) {
    const [successorId, setSuccessorId] = useState('')
    const [confirming, setConfirming] = useState(false)
    const successor = candidates.find((m) => m.id === successorId)

    async function transfer(to: Member) {
        if (await onTransfer(to)) setSuccessorId('')
        setConfirming(false)
    }

    return (
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
                    {candidates.map((member) => (
                        <option key={member.id} value={member.id}>
                            {member.username}
                        </option>
                    ))}
                </select>
                <button
                    onClick={() => setConfirming(true)}
                    disabled={!successor}
                    className="h-8 px-3 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-brand-500 transition disabled:opacity-40 shrink-0"
                >
                    Céder
                </button>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Tu deviendras administrateur et pourras ensuite quitter le projet.</p>

            {confirming && successor && (
                <ConfirmDialog
                    title={`Céder le projet à ${successor.username} ?`}
                    body={`Tu deviendras administrateur, et seul ${successor.username} pourra te le rendre.`}
                    confirmLabel="Céder le projet"
                    tone="neutral"
                    onCancel={() => setConfirming(false)}
                    onConfirm={() => transfer(successor)}
                />
            )}
        </div>
    )
}
