import { useState } from 'react'
import axios from 'axios'
import api from '../services/api'
import UserAvatar from './UserAvatar'
import type { Member } from '../types'

export default function MemberList({
    projectId,
    members,
    canManage,
    currentUserId,
    onAdded,
    onRemoved,
}: {
    projectId: string
    members: Member[]
    canManage: boolean
    currentUserId: string
    onAdded: (member: Member) => void
    onRemoved: (memberId: string) => void
}) {
    const [identifier, setIdentifier] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault()
        if (!identifier.trim()) return

        setError('')
        setLoading(true)
        try {
            const { data } = await api.post<Member>(`/projects/${projectId}/members`, {
                identifier: identifier.trim(),
            })
            onAdded(data)
            setIdentifier('')
        } catch (err) {
            // The server says exactly what went wrong (no such account,
            // already a member), and that is more useful than a generic line.
            setError(
                (axios.isAxiosError(err) && (err.response?.data as { message?: string })?.message) ||
                    "Impossible d'ajouter cette personne."
            )
        } finally {
            setLoading(false)
        }
    }

    async function handleRemove(member: Member) {
        if (!window.confirm(`Retirer ${member.username} du projet ? Ses tâches resteront, sans responsable.`)) {
            return
        }

        try {
            await api.delete(`/projects/${projectId}/members/${member.id}`)
            onRemoved(member.id)
        } catch (err) {
            setError(
                (axios.isAxiosError(err) && (err.response?.data as { message?: string })?.message) ||
                    'Impossible de retirer ce membre.'
            )
        }
    }

    return (
        <div>
            <h2 className="text-xs font-medium text-slate-500 mb-3">Membres ({members.length})</h2>

            <div className="flex flex-col gap-2 max-w-md">
                {members.map((member) => (
                    <div
                        key={member.id}
                        className="flex items-center gap-3 border border-border rounded-lg px-3 py-2"
                    >
                        <UserAvatar user={member} />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-700 truncate">
                                {member.username}
                                {member.id === currentUserId && <span className="text-slate-400"> · toi</span>}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{member.email}</p>
                        </div>
                        <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                                member.role === 'OWNER'
                                    ? 'bg-brand-50 text-brand-700'
                                    : 'bg-surface-muted text-slate-500'
                            }`}
                        >
                            {member.role === 'OWNER' ? 'Propriétaire' : 'Membre'}
                        </span>
                        {member.role !== 'OWNER' && (canManage || member.id === currentUserId) && (
                            <button
                                onClick={() => handleRemove(member)}
                                className="text-slate-300 hover:text-red-500 transition text-xs leading-none shrink-0"
                                title={member.id === currentUserId ? 'Quitter le projet' : 'Retirer du projet'}
                                aria-label={member.id === currentUserId ? 'Quitter le projet' : 'Retirer du projet'}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {canManage && (
                <form onSubmit={handleAdd} className="flex gap-2 mt-3 max-w-md">
                    <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="Email ou pseudo"
                        className="flex-1 h-8 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                    />
                    <button
                        type="submit"
                        disabled={loading || !identifier.trim()}
                        className="h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-xs font-medium transition disabled:opacity-60"
                    >
                        + Ajouter
                    </button>
                </form>
            )}

            {error && <p className="text-xs text-red-500 mt-2 max-w-md">{error}</p>}
        </div>
    )
}
