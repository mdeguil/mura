import { useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import ProjectCard from '../components/ProjectCard'
import CreateProjectModal from '../components/CreateProjectModal'
import InvitedProjectCard from '../components/InvitedProjectCard'
import api from '../services/api'
import type { Invitation, Project, ProjectType } from '../types'
import { PROJECT_TYPE_LABELS } from '../utils/projectMeta'
import { apiErrorMessage } from '../utils/apiError'

const TYPE_FILTERS = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]

export default function HomePage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<ProjectType | 'ALL'>('ALL')
    const [showCreateModal, setShowCreateModal] = useState(false)

    useEffect(() => {
        let cancelled = false

        api.get<Project[]>('/projects')
            .then(({ data }) => {
                if (!cancelled) setProjects(data)
            })
            .catch((err) => {
                if (!cancelled) setError(apiErrorMessage(err, 'Impossible de charger tes projets.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])


    // Pending invitations, dismissed from the bell or not: this list is
    // where someone comes back to find a project they were invited to.
    useEffect(() => {
        let cancelled = false

        api.get<Invitation[]>('/invitations')
            .then(({ data }) => {
                if (!cancelled) setInvitations(data)
            })
            .catch(() => {})

        return () => {
            cancelled = true
        }
    }, [])
    const filteredProjects = useMemo(() => {
        const q = query.trim().toLowerCase()
        return projects
            .filter((p) => !q || p.name.toLowerCase().includes(q))
            .filter((p) => typeFilter === 'ALL' || p.type === typeFilter)
    }, [projects, query, typeFilter])

    return (
        <div className="min-h-screen bg-app">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-800">Mes projets</h1>
                        <p className="text-sm text-slate-500 mt-1">Retrouve tous tes projets ici</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition"
                    >
                        + Créer un projet
                    </button>
                </div>

                {error && (
                    <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                        {error}
                    </div>
                )}

                {invitations.length > 0 && (
                    <section className="mb-8">
                        <h2 className="text-sm font-semibold text-slate-800 mb-1">
                            À rejoindre <span className="text-slate-400 font-normal">{invitations.length}</span>
                        </h2>
                        <p className="text-xs text-slate-500 mb-3">
                            Des projets t'attendent. Ouvre-les pour voir qui en fait partie, puis accepte ou refuse.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {invitations.map((invitation) => (
                                <InvitedProjectCard key={invitation.id} invitation={invitation} />
                            ))}
                        </div>
                    </section>
                )}

                <div className="relative mb-3 max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Rechercher un projet…"
                        className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                    />
                </div>


                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setTypeFilter('ALL')}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                            typeFilter === 'ALL'
                                ? 'bg-slate-800 text-white border-slate-800'
                                : 'bg-surface text-slate-600 border-border-strong hover:border-brand-500'
                        }`}
                    >
                        Tous
                    </button>
                    {TYPE_FILTERS.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTypeFilter(t)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                                typeFilter === t
                                    ? 'bg-slate-800 text-white border-slate-800'
                                    : 'bg-surface text-slate-600 border-border-strong hover:border-brand-500'
                            }`}
                        >
                            {PROJECT_TYPE_LABELS[t]}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-sm text-slate-500">Chargement…</div>
                ) : projects.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-brand-500 to-emerald-400 flex items-center justify-center mb-4">
                            <span className="text-white text-2xl">📋</span>
                        </div>
                        <h2 className="text-base font-semibold text-slate-800 mb-1">Aucun projet pour l'instant</h2>
                        <p className="text-sm text-slate-500 max-w-sm">
                            Crée ton premier projet pour commencer à organiser tes tâches en listes et cartes.
                        </p>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                        <h2 className="text-base font-semibold text-slate-800 mb-1">
                            {query ? <>Aucun résultat pour « {query} »</> : 'Aucun projet ne correspond à ce filtre'}
                        </h2>
                        <p className="text-sm text-slate-500 max-w-sm">Essaie un autre nom ou un autre type.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {filteredProjects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </main>

            {showCreateModal && (
                <CreateProjectModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={(project) => setProjects((prev) => [project, ...prev])}
                />
            )}
        </div>
    )
}
