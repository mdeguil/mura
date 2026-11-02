import { useState } from 'react'
import api from '../services/api'
import GroupPicker, { type GroupSelection } from './GroupPicker'
import { apiErrorMessage } from '../utils/apiError'
import type { Member } from '../types'

// Bringing people over from one of your groups, straight onto the team: no
// invitation, they are in as soon as this is sent and are told so.
export default function GroupAddPanel({
    projectId,
    members,
    onAdded,
    onCancel,
}: {
    projectId: string
    members: Member[]
    // The whole team as it now stands, and who among it just joined.
    onAdded: (members: Member[], joinedIds: string[]) => void
    onCancel: () => void
}) {
    const [selection, setSelection] = useState<GroupSelection | null>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const count = selection?.joiningCount ?? 0

    async function add() {
        if (!selection) return

        setError('')
        setSaving(true)
        try {
            const { data } = await api.post<Member[]>(`/projects/${projectId}/members/from-group`, {
                groupId: selection.groupId,
            })
            // Who joined is read from the answer: the server decides who in
            // the group could come, not this page.
            const joinedIds = data.filter((m) => !members.some((old) => old.id === m.id)).map((m) => m.id)
            onAdded(data, joinedIds)
        } catch (err) {
            setError(apiErrorMessage(err, "Ces personnes n'ont pas pu être ajoutées."))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="mb-4">
            <div className="mb-3">
                <GroupPicker
                    leftOut={(person) =>
                        members.some((m) => m.id === person.id) ? 'Déjà dans le projet' : null
                    }
                    onChange={setSelection}
                />
            </div>

            {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                    {error}
                </p>
            )}

            {/* Above the buttons rather than beside them: the panel sits in
                a narrow column, and this is the line that has to be read. */}
            <p className="text-[11px] text-slate-400 mb-2">
                Sans invitation : ils rejoignent l'équipe tout de suite, et en sont prévenus.
            </p>
            <div className="flex items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="h-9 px-3 rounded-lg text-xs font-medium text-slate-500 hover:bg-surface-muted transition"
                >
                    Annuler
                </button>
                <button
                    type="button"
                    onClick={add}
                    disabled={saving || count === 0}
                    className="h-9 px-3 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-xs font-medium transition disabled:opacity-60"
                >
                    {saving ? 'Ajout…' : 'Ajouter le groupe'}
                </button>
            </div>
        </div>
    )
}
