import { useEffect, useState } from 'react'
import api from '../services/api'
import UserAvatar, { SuspendedPill } from './UserAvatar'
import { apiErrorMessage } from '../utils/apiError'
import type { Group, GroupMember } from '../types'

export interface GroupSelection {
    groupId: string
    groupName: string
    // How many of its people will actually come, for the button and the
    // summary. The server works the list out again on its own.
    joiningCount: number
}

// One of the reader's groups, taken whole. Nobody is picked one by one: the
// list underneath only says who will come and who will not, and why. What
// happens to the group is the caller's business -- added to a project now,
// or once it is created.
export default function GroupPicker({
    leftOut,
    allowNone = false,
    countOnly = false,
    onChange,
}: {
    // Why the caller has no use for someone -- already on the team, say --
    // or null. Being set aside and being suspended are handled here.
    leftOut: (person: GroupMember) => string | null
    // Start on "no group" rather than the first one, where bringing a group
    // along is optional and must not happen just because the field exists.
    allowNone?: boolean
    // Say how many will come, without listing them. The creation form asks
    // for that: it is a form among others there, not a team to look over.
    countOnly?: boolean
    onChange: (selection: GroupSelection | null) => void
}) {
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [groupId, setGroupId] = useState('')

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

    const joining = group ? group.members.filter((m) => reasonLeftOut(m) === null) : []

    useEffect(() => {
        let cancelled = false

        api.get<Group[]>('/groups')
            .then(({ data }) => {
                if (cancelled) return
                setGroups(data)
                if (!allowNone && data.length > 0) setGroupId(data[0].id)
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
    }, [allowNone])

    useEffect(() => {
        onChange(group ? { groupId: group.id, groupName: group.name, joiningCount: joining.length } : null)
        // Reported whenever the choice changes, not whenever the caller
        // hands down a new callback.
    }, [group, joining.length])

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
                Tu ne fais partie d'aucun groupe pour l'instant. Les groupes sont créés par un
                administrateur, et leur gérant y ajoute les personnes.
            </p>
        )
    }

    return (
        <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Quel groupe ?</label>
            <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition mb-2"
            >
                {allowNone && <option value="">Aucun groupe</option>}
                {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                        {g.name}
                    </option>
                ))}
            </select>

            {group && (
                <>
                    {/* Read only: who comes is decided by the group, not
                        ticked here. */}
                    {!countOnly && (
                        <ul className="bg-surface-muted border border-border rounded-xl divide-y divide-border max-h-64 overflow-y-auto">
                            {group.members.map((person) => {
                                const reason = reasonLeftOut(person)
                                return (
                                    <li
                                        key={person.id}
                                        className={`px-3 py-2 flex items-center gap-3 ${reason ? 'opacity-50' : ''}`}
                                    >
                                        <UserAvatar user={person} size="sm" />
                                        <span className="min-w-0 flex-1 text-xs text-slate-700 truncate flex items-center gap-1.5">
                                            <span className="truncate">{person.username}</span>
                                            {person.suspended && <SuspendedPill />}
                                        </span>
                                        {reason && reason !== 'Suspendu' && (
                                            <span className="text-[10px] text-slate-400 shrink-0">{reason}</span>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                        {joining.length === 0
                            ? 'Personne à ajouter dans ce groupe.'
                            : `${joining.length} personne${joining.length > 1 ? 's' : ''} rejoindr${
                                  joining.length > 1 ? 'ont' : 'a'
                              } le projet.`}
                    </p>
                </>
            )}
        </div>
    )
}
