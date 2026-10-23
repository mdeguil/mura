import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import UserAvatar from './UserAvatar'
import { apiErrorMessage } from '../utils/apiError'
import type { Group } from '../types'

// The list, and nothing else: a card opens the group's own page, the way a
// project card opens the project. Managing a list of people from inside a
// row was never going to fit once the row had to hold a hold button too.
export default function GroupList() {
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [creating, setCreating] = useState(false)
    const [newName, setNewName] = useState('')

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
                    {groups.map((group) => {
                        const onHold = group.members.filter((m) => m.onHold).length
                        return (
                            <li key={group.id}>
                                <Link
                                    to={`/groupe/${group.id}`}
                                    className="block bg-surface border border-border rounded-xl p-4 hover:border-emerald-400 transition"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                                {group.name}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {group.members.length} personne
                                                {group.members.length > 1 ? 's' : ''}
                                                {onHold > 0 && <> · {onHold} en retrait</>}
                                                {group.owned ? (
                                                    <> · tu le gères</>
                                                ) : (
                                                    <> · géré par {group.owner.username}</>
                                                )}
                                            </p>
                                        </div>
                                        <span className="text-xs text-slate-400 shrink-0">Ouvrir →</span>
                                    </div>

                                    {/* Les visages d'abord : reconnaître un groupe,
                                        c'est reconnaître qui est dedans. */}
                                    <ul className="flex flex-wrap gap-2 mt-3">
                                        {group.members.map((member) => (
                                            <li
                                                key={member.id}
                                                className={`flex items-center gap-2 bg-surface-muted border border-border rounded-full pl-1 pr-2.5 py-1 ${
                                                    member.onHold ? 'opacity-50' : ''
                                                }`}
                                            >
                                                <UserAvatar user={member} size="sm" />
                                                <span className="text-xs text-slate-600">
                                                    {member.username}
                                                    {member.id === group.owner.id && (
                                                        <span className="text-slate-400"> · gérant</span>
                                                    )}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
