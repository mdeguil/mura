import { useState } from 'react'
import api from '../services/api'
import UserAvatar from './UserAvatar'
import type { Member } from '../types'
import { apiErrorMessage } from '../utils/apiError'

// Removing someone and showing yourself out are the same act seen from two
// sides, so they share one dialog — only the wording and the recipient of
// the note differ.
export type Departure = { member: Member; leaving: boolean }

const DEFAULT_MESSAGE = {
    removal: "L'équipe du projet a été réorganisée.",
    leaving: 'Je ne travaille plus sur ce projet.',
}

export default function MemberDepartureDialog({
    projectId,
    departure,
    onClose,
    onDone,
}: {
    projectId: string
    departure: Departure
    onClose: () => void
    onDone: (memberId: string) => void
}) {
    const { member, leaving } = departure
    const [message, setMessage] = useState(
        leaving ? DEFAULT_MESSAGE.leaving : DEFAULT_MESSAGE.removal
    )
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function confirm() {
        setError('')
        setLoading(true)
        try {
            await api.post(`/projects/${projectId}/members/${member.id}/remove`, { message })
            onDone(member.id)
        } catch (err) {
            setError(
                apiErrorMessage(
                    err,
                    leaving ? 'Impossible de quitter le projet.' : 'Impossible de retirer ce membre.'
                )
            )
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-lg overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-border">
                    <h2 className="text-base font-semibold text-slate-800">
                        {leaving ? 'Quitter le projet' : `Retirer ${member.username} du projet`}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {leaving
                            ? 'Tu perdras l’accès aux tâches et au planning. Les tâches dont tu étais responsable restent au projet, sans personne en charge.'
                            : 'Cette personne perdra l’accès au projet. Ses tâches restent, sans personne en charge.'}
                    </p>
                </div>

                <div className="px-6 py-5">
                    {!leaving && (
                        <div className="flex items-center gap-3 mb-4 border border-border rounded-lg px-3 py-2">
                            <UserAvatar user={member} />
                            <div className="min-w-0">
                                <p className="text-sm text-slate-700 truncate">{member.username}</p>
                                {member.email && (
                                    <p className="text-xs text-slate-400 truncate">{member.email}</p>
                                )}
                            </div>
                        </div>
                    )}

                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        {leaving ? "Mot pour l'équipe" : 'Mot pour la personne'}
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                        maxLength={500}
                        className="w-full rounded-lg border border-border-strong bg-surface-muted px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-1.5">
                        {leaving
                            ? 'Les responsables du projet recevront ce message. Tu peux le vider.'
                            : 'Elle recevra ce message dans ses notifications. Tu peux le vider.'}
                    </p>

                    {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
                </div>

                <div className="px-6 py-4 border-t border-border bg-surface-muted/60 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface transition"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={confirm}
                        disabled={loading}
                        className="h-9 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-60"
                    >
                        {loading ? 'En cours…' : leaving ? 'Quitter le projet' : 'Retirer du projet'}
                    </button>
                </div>
            </div>
        </div>
    )
}
