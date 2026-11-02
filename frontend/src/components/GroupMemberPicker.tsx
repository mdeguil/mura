import { useEffect, useState } from 'react'
import api from '../services/api'
import UserAvatar, { SuspendedPill } from './UserAvatar'
import { apiErrorMessage } from '../utils/apiError'
import type { Group, GroupMember } from '../types'

export interface GroupSelection {
    groupId: string
    groupName: string
    memberIds: string[]
}

// One of the reader's groups and who to take from it. The whole group and a
// hand-picked few are the same thing here -- everyone eligible starts ticked,
// and unticking is how you choose. What happens to the selection is the
// caller's business: added to a project now, or once it is created.
export default function GroupMemberPicker({
    leftOut,
    onChange,
}: {
    // Why the caller has no use for someone -- already on the team, say --
    // or null. Being set aside and being suspended are handled here.
    leftOut: (person: GroupMember) => string | null
    onChange: (selection: GroupSelection | null) => void
}) {
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [groupId, setGroupId] = useState('')
    const [selected, setSelected] = useState<Set<string>>(new Set())

    const group = groups.find((g) => g.id === groupId) ?? null

    // Set aside by the gérant is the gérant's call, and a suspended account
    // cannot sign in to use the project: neither is brought along.
    function reasonLeftOut(person: GroupMember): string | null {
        const own = leftOut(person)
        if (own) return own
        if (person.onHold) return 'En retrait'
        if (person.suspended) return 'Suspendu'
        return null
    }

    function eligibleOf(g: Group) {
        return g.members.filter((m) => reasonLeftOut(m) === null)
    }

    function pickGroup(g: Group | undefined) {
        setGroupId(g?.id ?? '')
        setSelected(new Set(g ? eligibleOf(g).map((m) => m.id) : []))
    }

    useEffect(() => {
        let cancelled = false

        api.get<Group[]>('/groups')
            .then(({ data }) => {
                if (cancelled) return
                setGroups(data)
                pickGroup(data[0])
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
        // Loaded once when the picker appears; who is left out is read
        // fresh on every render.
    }, [])

    useEffect(() => {
        onChange(
            group && selected.size > 0
                ? { groupId: group.id, groupName: group.name, memberIds: [...selected] }
                : null
        )
        // Reported whenever the choice changes, not whenever the caller
        // hands down a new callback.
    }, [group, selected])

    function toggle(personId: string) {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(personId)) next.delete(personId)
            else next.add(personId)
            return next
        })
    }

    if (loading) return <p className="text-xs text-slate-500">Chargement de tes groupes…</p>

    if (error) {
        return (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
            </p>
        )
    }

    if (groups.length === 0) {
        return (
            <p className="text-xs text-slate-500">
                Tu ne fais partie d'aucun groupe pour l'instant. Les groupes se créent depuis
                l'Administration, et leur gérant y ajoute les personnes.
            </p>
        )
    }

    const eligible = group ? eligibleOf(group) : []
    const allTicked = eligible.length > 0 && eligible.every((m) => selected.has(m.id))

    return (
        <div>
            <div className="flex items-end gap-2 mb-2">
                <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                        Quel groupe ?
                    </label>
                    <select
                        value={groupId}
                        onChange={(e) => pickGroup(groups.find((g) => g.id === e.target.value))}
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
                <ul className="bg-surface-muted border border-border rounded-xl divide-y divide-border max-h-64 overflow-y-auto">
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
        </div>
    )
}
