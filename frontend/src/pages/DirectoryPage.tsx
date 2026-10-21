import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import UserAvatar from '../components/UserAvatar'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import type { KnownUser } from '../types'
import { projectGlassBackground } from '../utils/color'

export default function DirectoryPage() {
    const [people, setPeople] = useState<KnownUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')

    useEffect(() => {
        let cancelled = false

        api.get<KnownUser[]>('/directory')
            .then(({ data }) => {
                if (!cancelled) setPeople(data)
            })
            .catch((err) => {
                if (!cancelled) setError(apiErrorMessage(err, 'Impossible de charger ton carnet.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return people
        return people.filter(
            (p) =>
                p.username.toLowerCase().includes(q) ||
                (p.email ?? '').toLowerCase().includes(q) ||
                p.sharedProjects.some((s) => s.name.toLowerCase().includes(q))
        )
    }, [people, query])

    return (
        <div className="min-h-screen bg-app">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-slate-800">Carnet</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Les personnes que tu croises sur Mura : celles de tes projets, et celles avec qui
                        tu as échangé une invitation.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                <div className="relative mb-6 max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Rechercher une personne ou un projet…"
                        className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                    />
                </div>

                {loading ? (
                    <div className="text-sm text-slate-500">Chargement…</div>
                ) : people.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-brand-500 to-emerald-400 flex items-center justify-center mb-4">
                            <span className="text-white text-2xl">📇</span>
                        </div>
                        <h2 className="text-base font-semibold text-slate-800 mb-1">
                            Ton carnet est vide
                        </h2>
                        <p className="text-sm text-slate-500 max-w-sm">
                            Invite quelqu'un sur un projet, et il apparaîtra ici.
                        </p>
                    </div>
                ) : shown.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl py-16 px-6 text-center">
                        <h2 className="text-base font-semibold text-slate-800 mb-1">
                            Aucun résultat pour « {query} »
                        </h2>
                        <p className="text-sm text-slate-500">Essaie un autre nom, un email ou un projet.</p>
                    </div>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {shown.map((person) => (
                            <li
                                key={person.id}
                                className="flex items-start gap-3 bg-surface border border-border rounded-xl px-4 py-3"
                            >
                                <UserAvatar user={{ ...person, email: person.email }} />
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm text-slate-800">{person.username}</p>
                                    {person.email && (
                                        <p className="text-xs text-slate-400 truncate">{person.email}</p>
                                    )}

                                    {person.sharedProjects.length > 0 ? (
                                        <ul className="flex flex-wrap gap-1.5 mt-2">
                                            {person.sharedProjects.map((project) => (
                                                <li key={project.id}>
                                                    <Link
                                                        to={`/project/${project.id}`}
                                                        className="flex items-center gap-1.5 bg-surface-muted border border-border rounded-full pl-1.5 pr-2.5 py-0.5 hover:border-brand-500 transition"
                                                    >
                                                        <span
                                                            className="w-2 h-2 rounded-full"
                                                            style={{
                                                                background: projectGlassBackground(project.color),
                                                            }}
                                                        />
                                                        <span className="text-xs text-slate-600">
                                                            {project.name}
                                                        </span>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-xs text-slate-400 mt-2 italic">
                                            Aucun projet en commun pour l'instant.
                                        </p>
                                    )}
                                </div>
                                <span className="text-xs text-slate-400 shrink-0 mt-0.5">
                                    {person.sharedProjects.length > 0
                                        ? `${person.sharedProjects.length} projet${person.sharedProjects.length > 1 ? 's' : ''}`
                                        : 'Invitation'}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </main>
        </div>
    )
}
