import { useEffect, useRef, useState } from 'react'
import UserAvatar, { SuspendedPill } from './UserAvatar'
import { useApiQuery } from '../hooks/useApiQuery'
import type { Group, GroupMember } from '../types'

/** The group chosen in a GroupPicker. */
export interface GroupSelection {
    /** The group's id. */
    groupId: string
    /** The group's name. */
    groupName: string
    /**
     * How many of its people will actually come, for the button and the
     * summary. The server works the list out again on its own.
     */
    joiningCount: number
}

/**
 * One of the reader's groups, taken whole. Nobody is picked one by one: the
 * list underneath only says who will come and who will not, and why. What
 * happens to the group is the caller's business -- added to a project now,
 * or once it is created.
 *
 * @param props who to leave out, how to start, and where the choice goes
 */
export default function GroupPicker({
    leftOut,
    allowNone = false,
    countOnly = false,
    onChange,
}: {
    /**
     * Why the caller has no use for someone -- already on the team, say --
     * or null. Being set aside and being suspended are handled here.
     */
    leftOut: (person: GroupMember) => string | null
    /**
     * Start on "no group" rather than the first one, where bringing a group
     * along is optional and must not happen just because the field exists.
     */
    allowNone?: boolean
    /**
     * Say how many will come, without listing them. The creation form asks
     * for that: it is a form among others there, not a team to look over.
     */
    countOnly?: boolean
    /** Called with the chosen group, or null, whenever the choice changes. */
    onChange: (selection: GroupSelection | null) => void
}) {
    const { data: groups, loading, error } = useApiQuery<Group[]>('/groups', [], 'Impossible de charger tes groupes.')
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

    function joiningOf(g: Group) {
        return g.members.filter((m) => reasonLeftOut(m) === null)
    }

    const joining = group ? joiningOf(group) : []

    // Picking the chosen group again lets go of it, where going without one
    // is allowed: that is the only way back to no group.
    function pick(g: Group) {
        setGroupId(g.id === groupId && allowNone ? '' : g.id)
    }

    // Where a group is required, the first one is chosen as soon as the
    // list arrives.
    useEffect(() => {
        if (!allowNone && !groupId && groups.length > 0) setGroupId(groups[0].id)
    }, [allowNone, groupId, groups])

    // Reported whenever the choice changes, not whenever the caller hands
    // down a new callback: the latest one is read from here.
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange

    useEffect(() => {
        onChangeRef.current(group ? { groupId: group.id, groupName: group.name, joiningCount: joining.length } : null)
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
            <p id="group-picker-label" className="text-xs font-medium text-slate-600 mb-1.5">
                Quel groupe ?
            </p>
            {/* Cards rather than a select: a group is recognised by its
                faces, and how many it brings is the thing being decided. */}
            <ul
                role="radiogroup"
                aria-labelledby="group-picker-label"
                className="flex flex-col gap-2 max-h-72 overflow-y-auto p-0.5 mb-2"
            >
                {groups.map((g) => {
                    const selected = g.id === groupId
                    const count = joiningOf(g).length
                    return (
                        <li key={g.id}>
                            <button
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                onClick={() => pick(g)}
                                className={`w-full text-left rounded-xl border px-3 py-2.5 flex items-center gap-3 transition ${
                                    selected
                                        ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                                        : 'border-border bg-surface hover:border-brand-300'
                                }`}
                            >
                                <span className="flex -space-x-2 shrink-0" aria-hidden="true">
                                    {g.members.slice(0, 3).map((m) => (
                                        <span key={m.id} className="rounded-full ring-2 ring-surface">
                                            <UserAvatar user={m} size="sm" />
                                        </span>
                                    ))}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-sm font-medium text-slate-800 truncate">
                                        {g.name}
                                    </span>
                                    <span className="block text-[11px] text-slate-400 truncate">
                                        {g.owned ? 'tu le gères' : `géré par ${g.owner.username}`}
                                    </span>
                                </span>
                                <span
                                    className={`shrink-0 text-xs font-medium whitespace-nowrap px-2 py-0.5 rounded-full border ${
                                        count > 0
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-surface-muted text-slate-400 border-border'
                                    }`}
                                    title={
                                        count === 0
                                            ? 'Personne à ajouter dans ce groupe'
                                            : `${count} personne${count > 1 ? 's' : ''} rejoindr${
                                                  count > 1 ? 'ont' : 'a'
                                              } le projet`
                                    }
                                >
                                    👥 {count}
                                </span>
                            </button>
                        </li>
                    )
                })}
            </ul>

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
                        {allowNone && (
                            <>
                                {' '}
                                <button
                                    type="button"
                                    onClick={() => setGroupId('')}
                                    className="text-brand-600 hover:text-brand-700 underline-offset-2 hover:underline"
                                >
                                    Retirer le groupe
                                </button>
                            </>
                        )}
                    </p>
                </>
            )}
        </div>
    )
}
