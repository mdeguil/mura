import { useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import UserAvatar, { SuspendedPill } from './UserAvatar'
import { apiErrorMessage } from '../utils/apiError'
import type { Group, GroupMember, Member } from '../types'

// Bringing people over from one of your groups, straight onto the team: no
// invitation, they are in as soon as this is sent and are told so. The whole
// group and a hand-picked few are the same thing here -- everyone eligible
// starts ticked, and unticking is how you choose.
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
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [groupId, setGroupId] = useState('')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members])
    const group = groups.find((g) => g.id === groupId) ?? null

    // Why someone cannot be ticked, or null if they can. Set aside by the
    // gérant is the gérant's call, and a suspended account cannot sign in to
    // use the project: neither is brought along.
    function reasonLeftOut(person: GroupMember): string | null {
        if (memberIds.has(person.id)) return 'Déjà dans le projet'
        if (person.onHold) return 'En retrait'
        if (person.suspended) return 'Suspendu'
        return null
    }

    function eligibleOf(g: Group) {
        return g.members.filter((m) => reasonLeftOut(m) === null)
    }

    function pickGroup(id: string) {
        setGroupId(id)
        setError('')
        const g = groups.find((x) => x.id === id)
        setSelected(new Set(g ? eligibleOf(g).map((m) => m.id) : []))
    }

    useEffect(() => {
        let cancelled = false

        api.get<Group[]>('/groups')
            .then(({ data }) => {
                if (cancelled) return
                setGroups(data)
                if (data.length > 0) {
                    setGroupId(data[0].id)
                    setSelected(new Set(eligibleOf(data[0]).map((m) => m.id)))
                }
            })
            .catch((err) => {
                if (!cancelled) setError(apiErrorMessage(err, 'Impossible de charger tes groupes.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
        // Loaded once when the panel opens; the team it is compared against
        // is read fresh on every render.
    }, [])

    function toggle(personId: string) {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(personId)) next.delete(personId)
            else next.add(personId)
            return next
        })
    }

    async function add() {
        if (!group || selected.size === 0) return

        setError('')
        setSaving(true)
        try {
            const ids = [...selected]
            const { data } = await api.post<Member[]>(`/projects/${projectId}/members/from-group`, {
                groupId: group.id,
                memberIds: ids,
            })
            onAdded(data, ids)
        } catch (err) {
            setError(apiErrorMessage(err, "Ces personnes n'ont pas pu être ajoutées."))
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <p className="text-xs text-slate-500 mb-4">Chargement de tes groupes…</p>

    if (groups.length === 0) {
        return (
            <p className="text-xs text-slate-500 mb-4">
                Tu ne fais partie d'aucun groupe pour l'instant. Les groupes se créent depuis
                l'Administration, et leur gérant y ajoute les personnes.
            </p>
        )
    }

    const eligible = group ? eligibleOf(group) : []
    const allTicked = eligible.length > 0 && eligible.every((m) => selected.has(m.id))

    return (
        <div className="mb-4">
            <div className="flex items-end gap-2 mb-2">
                <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Quel groupe ?
                    </label>
                    <select
                        value={groupId}
                        onChange={(e) => pickGroup(e.target.value)}
                        className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                    >
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                                {g.name}
                            </option>
                        ))}
                    </select>
                </div>
                {eligible.length > 0 && (
                    <button
                        type="button"
                        onClick={() =>
                            setSelected(allTicked ? new Set() : new Set(eligible.map((m) => m.id)))
                        }
                        className="h-9 px-3 rounded-lg text-xs font-medium text-slate-500 hover:bg-surface-muted transition shrink-0"
                    >
                        {allTicked ? 'Tout décocher' : 'Tout le groupe'}
                    </button>
                )}
            </div>

            {group && (
                <ul className="bg-surface-muted border border-border rounded-xl divide-y divide-border mb-3 max-h-64 overflow-y-auto">
                    {group.members.map((person) => {
                        const reason = reasonLeftOut(person)
                        return (
                            <li key={person.id}>
                                <label
                                    className={`px-3 py-2 flex items-center gap-3 ${
                                        reason ? 'opacity-50' : 'cursor-pointer hover:bg-surface'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={reason === null && selected.has(person.id)}
                                        disabled={reason !== null}
                                        onChange={() => toggle(person.id)}
                                        className="w-4 h-4 rounded accent-brand-500 shrink-0"
                                    />
                                    <UserAvatar user={person} size="sm" />
                                    <span className="min-w-0 flex-1 text-xs text-slate-700 truncate flex items-center gap-1.5">
                                        <span className="truncate">{person.username}</span>
                                        {person.suspended && <SuspendedPill />}
                                    </span>
                                    {reason && reason !== 'Suspendu' && (
                                        <span className="text-[10px] text-slate-400 shrink-0">{reason}</span>
                                    )}
                                </label>
                            </li>
                        )
                    })}
                </ul>
            )}

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
                    disabled={saving || selected.size === 0}
                    className="h-9 px-3 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-xs font-medium transition disabled:opacity-60"
                >
                    {saving
                        ? 'Ajout…'
                        : selected.size === 0
                          ? 'Ajouter'
                          : `Ajouter ${selected.size} personne${selected.size > 1 ? 's' : ''}`}
                </button>
            </div>
        </div>
    )
}
