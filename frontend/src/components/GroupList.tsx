import { useEffect, useState } from 'react'
import api from '../services/api'
import UserAvatar from './UserAvatar'
import { apiErrorMessage } from '../utils/apiError'
import type { Group, KnownUser } from '../types'

export default function GroupList({
    currentUserId,
    carnet,
}: {
    currentUserId: string
    // Offered as suggestions when adding someone: the carnet is where the
    // addresses already are.
    carnet: KnownUser[]
}) {
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [creating, setCreating] = useState(false)
    const [newName, setNewName] = useState('')
    const [addingTo, setAddingTo] = useState<string | null>(null)
    const [email, setEmail] = useState('')

    useEffect(() => {
        let cancelled = false

        api.get<Group[]>('/groups')
            .then(({ data }) => {
                if (!cancelled) setGroups(data)
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
    }, [])

    function replace(group: Group) {
        setGroups((prev) => prev.map((g) => (g.id === group.id ? group : g)))
    }

    async function create(e: React.FormEvent) {
        e.preventDefault()
        if (!newName.trim()) return

        setError('')
        try {
            const { data } = await api.post<Group>('/groups', { name: newName.trim() })
            setGroups((prev) => [...prev, data])
            setNewName('')
            setCreating(false)
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de créer ce groupe.'))
        }
    }

    async function rename(group: Group) {
        const name = window.prompt('Nouveau nom du groupe', group.name)
        if (name === null || !name.trim() || name.trim() === group.name) return

        setError('')
        try {
            const { data } = await api.put<Group>(`/groups/${group.id}`, { name: name.trim() })
            replace(data)
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de renommer ce groupe.'))
        }
    }

    async function remove(group: Group) {
        if (!window.confirm(`Supprimer le groupe « ${group.name} » ? Les personnes ne sont pas touchées.`)) {
            return
        }

        setError('')
        try {
            await api.delete(`/groups/${group.id}`)
            setGroups((prev) => prev.filter((g) => g.id !== group.id))
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de supprimer ce groupe.'))
        }
    }

    async function addMember(e: React.FormEvent, group: Group) {
        e.preventDefault()
        if (!email.trim()) return

        setError('')
        try {
            const { data } = await api.post<Group>(`/groups/${group.id}/members`, {
                email: email.trim(),
            })
            replace(data)
            setEmail('')
            setAddingTo(null)
        } catch (err) {
            setError(apiErrorMessage(err, "Impossible d'ajouter cette personne."))
        }
    }

    async function removeMember(group: Group, memberId: string) {
        setError('')
        try {
            await api.delete(`/groups/${group.id}/members/${memberId}`)
            if (memberId === currentUserId) {
                setGroups((prev) => prev.filter((g) => g.id !== group.id))
                return
            }
            replace({ ...group, members: group.members.filter((m) => m.id !== memberId) })
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de retirer cette personne.'))
        }
    }

    if (loading) return <div className="text-sm text-slate-500">Chargement…</div>

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-4">
                <p className="text-sm text-slate-500">
                    Un groupe garde une équipe sous la main. Il n’ouvre aucun projet par lui-même : il
                    sert à inviter tout le monde d’un coup.
                </p>
                <button
                    onClick={() => setCreating((v) => !v)}
                    className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition shrink-0"
                >
                    {creating ? 'Annuler' : '+ Nouveau groupe'}
                </button>
            </div>

            {creating && (
                <form onSubmit={create} className="mb-5 bg-surface border border-border rounded-xl p-4 max-w-md">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom du groupe</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Escape' && setCreating(false)}
                            placeholder="Ex : Pôle design"
                            maxLength={100}
                            required
                            autoFocus
                            className="flex-1 min-w-0 h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                        />
                        <button
                            type="submit"
                            disabled={!newName.trim()}
                            className="h-9 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition disabled:opacity-60 shrink-0"
                        >
                            Créer
                        </button>
                    </div>
                </form>
            )}

            {error && <p className="text-xs text-red-500 mb-4">{error}</p>}

            {groups.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-brand-500 to-emerald-400 flex items-center justify-center mb-4">
                        <span className="text-white text-2xl">👥</span>
                    </div>
                    <h2 className="text-base font-semibold text-slate-800 mb-1">Aucun groupe</h2>
                    <p className="text-sm text-slate-500 max-w-sm">
                        Réunis les personnes avec qui tu travailles souvent, et invite-les ensemble.
                    </p>
                </div>
            ) : (
                <ul className="flex flex-col gap-3">
                    {groups.map((group) => (
                        <li key={group.id} className="bg-surface border border-border rounded-xl p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-800">{group.name}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {group.members.length} personne{group.members.length > 1 ? 's' : ''}
                                        {!group.owned && <> · créé par {group.owner.username}</>}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    {group.owned ? (
                                        <>
                                            <button
                                                onClick={() =>
                                                    setAddingTo(addingTo === group.id ? null : group.id)
                                                }
                                                className="h-8 px-3 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-brand-500 transition"
                                            >
                                                + Ajouter
                                            </button>
                                            <button
                                                onClick={() => rename(group)}
                                                className="h-8 px-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-medium transition"
                                            >
                                                Renommer
                                            </button>
                                            <button
                                                onClick={() => remove(group)}
                                                className="h-8 px-3 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition"
                                            >
                                                Supprimer
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => removeMember(group, currentUserId)}
                                            className="h-8 px-3 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-red-400 hover:text-red-600 transition"
                                        >
                                            Quitter
                                        </button>
                                    )}
                                </div>
                            </div>

                            {addingTo === group.id && (
                                <form onSubmit={(e) => addMember(e, group)} className="flex gap-2 mt-3 max-w-md">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Escape' && setAddingTo(null)}
                                        placeholder="prenom@exemple.com"
                                        list={`carnet-${group.id}`}
                                        required
                                        autoFocus
                                        className="flex-1 min-w-0 h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                                    />
                                    <datalist id={`carnet-${group.id}`}>
                                        {carnet
                                            .filter((person) => person.email)
                                            .filter((person) => !group.members.some((m) => m.id === person.id))
                                            .map((person) => (
                                                <option key={person.id} value={person.email!}>
                                                    {person.username}
                                                </option>
                                            ))}
                                    </datalist>
                                    <button
                                        type="submit"
                                        disabled={!email.trim()}
                                        className="h-9 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition disabled:opacity-60 shrink-0"
                                    >
                                        Ajouter
                                    </button>
                                </form>
                            )}

                            <ul className="flex flex-wrap gap-2 mt-3">
                                {group.members.map((member) => (
                                    <li
                                        key={member.id}
                                        className="flex items-center gap-2 bg-surface-muted border border-border rounded-full pl-1 pr-2.5 py-1"
                                    >
                                        <UserAvatar user={member} size="sm" />
                                        <span className="text-xs text-slate-600">
                                            {member.username}
                                            {member.id === group.owner.id && (
                                                <span className="text-slate-400"> · propriétaire</span>
                                            )}
                                        </span>
                                        {group.owned && member.id !== group.owner.id && (
                                            <button
                                                onClick={() => removeMember(group, member.id)}
                                                className="text-slate-300 hover:text-red-500 transition text-xs leading-none"
                                                aria-label={`Retirer ${member.username} du groupe`}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
