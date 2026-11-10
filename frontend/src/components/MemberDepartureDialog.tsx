import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import api from '../services/api'
import UserAvatar from './UserAvatar'
import type { Member } from '../types'
import { apiErrorMessage } from '../utils/apiError'
import Modal from './Modal'

/** Someone about to leave a team, by their own choice or not. */
export type Departure = {
    /** The member. */
    member: Member
    /** True when they are showing themselves out, false when they are removed. */
    leaving: boolean
}


/**
 * Removing someone from a team, or leaving it, with a note for the people
 * told. Removing someone and showing yourself out are the same act seen
 * from two sides, so they share one dialog -- only the wording and the
 * recipient of the note differ.
 *
 * @param props the project, who is leaving, and what to do once they have
 */
export default function MemberDepartureDialog({
    projectId,
    departure,
    onClose,
    onDone,
}: {
    /** The project. */
    projectId: string
    /** Who is leaving, and whether by their own choice. */
    departure: Departure
    /** Closes the dialog; nobody leaves. */
    onClose: () => void
    /** Called with the member's id once the server has taken them off. */
    onDone: (memberId: string) => void
}) {
    const { t } = useTranslation()
    const { member, leaving } = departure
    const [message, setMessage] = useState(
        leaving ? t('departure.defaultLeaving') : t('departure.defaultRemoval')
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
                    leaving ? t('departure.leaveFailed') : t('departure.removeFailed')
                )
            )
            setLoading(false)
        }
    }

    return (
        <Modal labelledBy="member-departure-title" onClose={onClose} size="md" className="overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-border">
                <h2 id="member-departure-title" className="text-base font-semibold text-slate-800">
                    {leaving ? t('departure.leaveTitle') : t('departure.removeTitle', { name: member.username })}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                    {leaving
                        ? t('departure.leaveBody')
                        : t('departure.removeBody')}
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
                    {leaving ? t('departure.leaveNote') : t('departure.removeNote')}
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
                        ? t('departure.leaveNoteHint')
                        : t('departure.removeNoteHint')}
                </p>

                {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
            </div>

            <div className="px-6 py-4 border-t border-border bg-surface-muted/60 flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface transition"
                >
                    {t('common.cancel')}
                </button>
                <button
                    onClick={confirm}
                    disabled={loading}
                    className="h-9 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-60"
                >
                    {loading ? t('common.working') : leaving ? t('departure.leave') : t('departure.remove')}
                </button>
            </div>
        </Modal>
    )
}
