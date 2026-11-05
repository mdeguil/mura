import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import ProjectCard from '../components/ProjectCard'
import CreateProjectModal from '../components/CreateProjectModal'
import ErrorMessage from '../components/ErrorMessage'
import InvitedProjectCard from '../components/InvitedProjectCard'
import ArchivedProjectList from '../components/ArchivedProjectList'
import type { Invitation, Project, ProjectStatus } from '../types'
import { PROJECT_STATUS_LABELS } from '../utils/projectMeta'
import { useApiQuery } from '../hooks/useApiQuery'
import { useProjectTypes } from '../hooks/useProjectTypes'

type ProjectTab = 'ALL' | ProjectStatus | 'ARCHIVED'

const TABS: { key: ProjectTab; label: string }[] = [
    { key: 'ALL', label: 'Tous' },
    ...(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((status) => ({
        key: status as ProjectTab,
        label: PROJECT_STATUS_LABELS[status],
    })),
    { key: 'ARCHIVED', label: 'Archivés' },
]

/**
 * The project list, at /projets: the reader's projects in tabs by status,
 * the archived ones apart, the invitations still to answer, and creating a
 * new project.
 */
export default function HomePage() {
    const { types } = useProjectTypes()
    const {
        data: projects,
        setData: setProjects,
        loading,
        error,
        reload,
    } = useApiQuery<Project[]>('/projects', [], 'Impossible de charger tes projets.')
    const invitationsQuery = useApiQuery<Invitation[]>('/invitations', [], 'Impossible de charger tes invitations.')
    const archivedQuery = useApiQuery<Project[]>('/projects/archived', [], 'Impossible de charger tes projets archivés.')
    const invitations = invitationsQuery.data
    const { data: archived, setData: setArchived } = archivedQuery
    const [query, setQuery] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('ALL')
    const [tab, setTab] = useState<ProjectTab>('ALL')
    const [showCreateModal, setShowCreateModal] = useState(false)

    const narrow = useMemo(() => {
        const q = query.trim().toLowerCase()
        return (list: Project[]) =>
            list
                .filter((p) => !q || p.name.toLowerCase().includes(q))
                .filter((p) => typeFilter === 'ALL' || p.type.id === typeFilter)
    }, [query, typeFilter])

    const active = useMemo(() => narrow(projects), [narrow, projects])
    const narrowedArchived = useMemo(() => narrow(archived), [narrow, archived])

    function countFor(key: ProjectTab) {
        if (key === 'ALL') return active.length
        if (key === 'ARCHIVED') return narrowedArchived.length
        return active.filter((p) => p.status === key).length
    }

    const shown = tab === 'ALL' ? active : active.filter((p) => p.status === tab)

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
                        className="h-9 px-4 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition"
                    >
                        + Créer un projet
                    </button>
                </div>

                {invitationsQuery.error && (
                    <ErrorMessage onRetry={invitationsQuery.reload} className="mb-6">
                        {invitationsQuery.error}
                    </ErrorMessage>
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

                <div className="flex items-center gap-6 border-b border-border mb-5 overflow-x-auto overflow-y-hidden">
                    {TABS.map((entry) => {
                        const count = countFor(entry.key)
                        return (
                            <button
                                key={entry.key}
                                onClick={() => setTab(entry.key)}
                                className={`pb-3 -mb-px text-sm font-medium border-b-2 transition whitespace-nowrap ${
                                    tab === entry.key
                                        ? 'text-slate-800 border-brand-500'
                                        : 'text-slate-500 border-transparent hover:text-slate-700'
                                }`}
                            >
                                {entry.label}
                                <span className="text-slate-400 font-normal ml-1.5">{count}</span>
                            </button>
                        )
                    })}
                </div>

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

                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="text-xs text-slate-400 mr-1">Type</span>
                    <button
                        onClick={() => setTypeFilter('ALL')}
                        className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                            typeFilter === 'ALL'
                                ? 'bg-slate-800 text-surface border-slate-800'
                                : 'bg-surface text-slate-600 border-border-strong hover:border-brand-500'
                        }`}
                    >
                        Tous
                    </button>
                    {types.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTypeFilter(t.id)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition ${
                                typeFilter === t.id
                                    ? 'bg-slate-800 text-surface border-slate-800'
                                    : 'bg-surface text-slate-600 border-border-strong hover:border-brand-500'
                            }`}
                        >
                            {t.emoji} {t.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="text-sm text-slate-500">Chargement…</div>
                ) : tab === 'ARCHIVED' && archivedQuery.error ? (
                    <ErrorMessage onRetry={archivedQuery.reload}>{archivedQuery.error}</ErrorMessage>
                ) : tab !== 'ARCHIVED' && error ? (
                    <ErrorMessage onRetry={reload}>{error}</ErrorMessage>
                ) : tab === 'ARCHIVED' ? (
                    <ArchivedProjectList
                        projects={narrowedArchived}
                        onRestored={(project) => {
                            setArchived((prev) => prev.filter((p) => p.id !== project.id))
                            setProjects((prev) => [project, ...prev])
                        }}
                        onDeleted={(projectId) =>
                            setArchived((prev) => prev.filter((p) => p.id !== projectId))
                        }
                    />
                ) : projects.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-brand-gradient-diagonal flex items-center justify-center mb-4">
                            <span className="text-white text-2xl">📋</span>
                        </div>
                        <h2 className="text-base font-semibold text-slate-800 mb-1">Aucun projet pour l'instant</h2>
                        <p className="text-sm text-slate-500 max-w-sm">
                            Crée ton premier projet pour commencer à organiser tes tâches en listes et cartes.
                        </p>
                    </div>
                ) : shown.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                        <h2 className="text-base font-semibold text-slate-800 mb-1">
                            {query ? <>Aucun résultat pour « {query} »</> : 'Aucun projet dans cet onglet'}
                        </h2>
                        <p className="text-sm text-slate-500 max-w-sm">Essaie un autre nom, un autre type ou un autre onglet.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {shown.map((project) => (
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
