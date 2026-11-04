import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import UserAvatar, { SuspendedPill } from '../components/UserAvatar'
import GroupList from '../components/GroupList'
import ConfirmDialog from '../components/ConfirmDialog'
import ContactCard from '../components/ContactCard'
import ErrorMessage from '../components/ErrorMessage'
import LoadErrors from '../components/LoadErrors'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import { useApiQuery } from '../hooks/useApiQuery'
import { useAuthStore } from '../store/authStore'
import type { KnownUser, Project } from '../types'

/**
 * The carnet, at /carnet: the people the reader knows, the contact
 * requests waiting on an answer, and the reader's groups.
 */
export default function DirectoryPage() {
    const peopleQuery = useApiQuery<KnownUser[]>('/directory', [], 'Impossible de charger ton carnet.')
    const { data: people, setData: setPeople, loading } = peopleQuery
    // Not carnet entries yet: questions waiting on an answer.
    const requestsQuery = useApiQuery<KnownUser[]>(
        '/directory/requests',
        [],
        'Impossible de charger les demandes reçues.'
    )
    const { data: requests, setData: setRequests } = requestsQuery
    // Only to work out what the reader may invite someone onto.
    const projectsQuery = useApiQuery<Project[]>('/projects', [], 'Impossible de charger tes projets.')
    const projects = projectsQuery.data
    // Without the projects, the invite menus would offer nothing.
    const loadFailures = [peopleQuery, requestsQuery, projectsQuery]
        .filter((q) => q.error)
        .map((q) => ({ message: q.error, retry: q.reload }))
    // What went wrong answering a request, apart from the lists themselves.
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [tab, setTab] = useState<'people' | 'groups'>('people')
    const currentUserId = useAuthStore((s) => s.user?.id) ?? ''

    const [adding, setAdding] = useState(false)
    const [email, setEmail] = useState('')
    const [formError, setFormError] = useState('')
    const [saving, setSaving] = useState(false)
    const [removing, setRemoving] = useState<KnownUser | null>(null)
    const [favouritesOnly, setFavouritesOnly] = useState(false)
    // Favourites stay on top whichever way this points: the star is a
    // decision about importance, the sort only orders what is left.
    const [ascending, setAscending] = useState(true)

    async function acceptRequest(person: KnownUser) {
        setError('')
        try {
            const { data } = await api.post<KnownUser>(`/directory/requests/${person.id}/accept`)
            setRequests((prev) => prev.filter((r) => r.id !== person.id))
            setPeople((prev) => [data, ...prev.filter((p) => p.id !== data.id)])
        } catch (err) {
            setError(apiErrorMessage(err, "Impossible d'accepter cette demande."))
        }
    }

    async function declineRequest(person: KnownUser) {
        setError('')
        try {
            await api.post(`/directory/requests/${person.id}/decline`)
            setRequests((prev) => prev.filter((r) => r.id !== person.id))
        } catch (err) {
            setError(apiErrorMessage(err, "Impossible de refuser cette demande."))
        }
    }

    async function addContact(e: React.FormEvent) {
        e.preventDefault()
        if (!email.trim()) return

        setFormError('')
        setSaving(true)
        try {
            const { data } = await api.post<KnownUser>('/directory', { email: email.trim() })
            setPeople((prev) => [data, ...prev.filter((p) => p.id !== data.id)])
            setEmail('')
            setAdding(false)
        } catch (err) {
            setFormError(apiErrorMessage(err, "Impossible d'ajouter cette personne."))
        } finally {
            setSaving(false)
        }
    }

    async function removeContact(person: KnownUser) {
        setFormError('')
        try {
            await api.delete(`/directory/${person.id}`)
            // Out of the carnet whatever put them there; adding them again
            // by email brings them back.
            setPeople((prev) => prev.filter((p) => p.id !== person.id))
        } catch (err) {
            setFormError(apiErrorMessage(err, 'Impossible de retirer cette personne.'))
        }
    }

    async function toggleFavourite(person: KnownUser) {
        const next = !person.favourite
        // Optimistic: the star is the feedback, and a round trip before it
        // moves would make the list feel stuck.
        setPeople((prev) => prev.map((p) => (p.id === person.id ? { ...p, favourite: next } : p)))
        try {
            await api.put(`/directory/${person.id}/favourite`, { favourite: next })
        } catch (err) {
            setPeople((prev) =>
                prev.map((p) => (p.id === person.id ? { ...p, favourite: !next } : p))
            )
            setFormError(apiErrorMessage(err, 'Impossible de changer ce favori.'))
        }
    }

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase()
        return people
            .filter((p) => !favouritesOnly || p.favourite)
            .filter(
                (p) =>
                    !q ||
                    p.username.toLowerCase().includes(q) ||
                    (p.email ?? '').toLowerCase().includes(q) ||
                    p.sharedProjects.some((s) => s.name.toLowerCase().includes(q))
            )
            // Sorted here as well as on the server, so starring someone or
            // flipping the order lands without waiting for a reload.
            .sort(
                (a, b) =>
                    Number(b.favourite) - Number(a.favourite) ||
                    (ascending ? 1 : -1) *
                        a.username.localeCompare(b.username, 'fr', { sensitivity: 'base' })
            )
    }, [people, query, favouritesOnly, ascending])

    return (
        <div className="min-h-screen bg-app">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-800">Carnet</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Les personnes que tu croises sur Mura, et les groupes dont tu fais partie.
                        </p>
                    </div>
                    {tab === 'people' && (
                        <button
                            onClick={() => setAdding((v) => !v)}
                            className="h-9 px-4 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition shrink-0"
                        >
                            {adding ? 'Annuler' : '+ Ajouter une personne'}
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-6 border-b border-border mb-5 overflow-x-auto overflow-y-hidden">
                    {[
                        { key: 'people' as const, label: 'Personnes', count: people.length },
                        { key: 'groups' as const, label: 'Groupes', count: null },
                    ].map((entry) => (
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
                            {entry.count !== null && (
                                <span className="text-slate-400 font-normal ml-1.5">{entry.count}</span>
                            )}
                        </button>
                    ))}
                </div>

                {tab === 'people' ? (
                    <>
                    {adding && (
                        <form
                            onSubmit={addContact}
                            className="mb-6 bg-surface border border-border rounded-xl p-4 max-w-md"
                        >
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                Email de la personne
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
                                    placeholder="prenom@exemple.com"
                                    required
                                    autoFocus
                                    className="flex-1 min-w-0 h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                                />
                                <button
                                    type="submit"
                                    disabled={saving || !email.trim()}
                                    className="h-9 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-ink text-xs font-medium transition disabled:opacity-60 shrink-0"
                                >
                                    {saving ? 'Ajout…' : 'Ajouter'}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">
                                Elle rejoint ton carnet, rien de plus : aucun projet partagé, et elle n'en est
                                pas avertie.
                            </p>
                            {formError && <p className="text-xs text-red-500 mt-2">{formError}</p>}
                        </form>
                    )}

                    {error && <ErrorMessage className="mb-6">{error}</ErrorMessage>}
                    <LoadErrors failures={loadFailures} className="mb-6" />

                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <div className="relative flex-1 min-w-[16rem] max-w-sm">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Rechercher une personne ou un projet…"
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                            />
                        </div>
                        <button
                            onClick={() => setFavouritesOnly((v) => !v)}
                            aria-pressed={favouritesOnly}
                            className={`h-9 px-3 rounded-lg border text-xs font-medium transition flex items-center gap-1.5 ${
                                favouritesOnly
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-surface border-border-strong text-slate-600 hover:border-brand-500'
                            }`}
                        >
                            <span aria-hidden="true">★</span>
                            Favoris uniquement
                            <span className="text-slate-400 font-normal">
                                {people.filter((p) => p.favourite).length}
                            </span>
                        </button>
                        <button
                            onClick={() => setAscending((v) => !v)}
                            className="h-9 px-3 rounded-lg border border-border-strong bg-surface text-slate-600 hover:border-brand-500 text-xs font-medium transition flex items-center gap-1.5"
                            title={
                                ascending
                                    ? 'Trié de A à Z — cliquer pour inverser'
                                    : 'Trié de Z à A — cliquer pour inverser'
                            }
                        >
                            <span aria-hidden="true">{ascending ? '↓' : '↑'}</span>
                            {ascending ? 'A → Z' : 'Z → A'}
                        </button>
                    </div>
                    {requests.length > 0 && (
                        <section className="mb-5">
                            <h2 className="text-xs font-medium text-slate-600 mb-2">
                                Demande{requests.length > 1 ? 's' : ''} reçue
                                {requests.length > 1 ? 's' : ''} ({requests.length})
                            </h2>
                            <ul className="flex flex-col gap-2">
                                {requests.map((person) => (
                                    <li
                                        key={person.id}
                                        className="flex items-center gap-3 bg-surface border border-blue-200 rounded-xl px-4 py-3"
                                    >
                                        <UserAvatar user={{ ...person, email: person.email }} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm text-slate-800 flex items-center gap-1.5">
                                                <span className="truncate">{person.username}</span>
                                                {person.suspended && <SuspendedPill />}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                aimerait t’ajouter à son carnet
                                                {person.sharedProjects.length > 0 &&
                                                    ` · ${person.sharedProjects.length} projet${person.sharedProjects.length > 1 ? 's' : ''} en commun`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => declineRequest(person)}
                                                className="h-8 px-3 rounded-lg border border-border-strong text-xs font-medium text-slate-600 hover:border-red-400 hover:text-red-600 transition"
                                            >
                                                Refuser
                                            </button>
                                            <button
                                                onClick={() => acceptRequest(person)}
                                                className="h-8 px-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition"
                                            >
                                                Accepter
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {loading ? (
                        <div className="text-sm text-slate-500">Chargement…</div>
                    ) : peopleQuery.error ? (
                        // Said above. Not "Ton carnet est vide": it may well not be.
                        null
                    ) : people.length === 0 ? (
                        <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-2xl bg-brand-gradient-diagonal flex items-center justify-center mb-4">
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
                                <ContactCard
                                    key={person.id}
                                    person={person}
                                    projects={projects}
                                    currentUserId={currentUserId}
                                    onToggleFavourite={() => toggleFavourite(person)}
                                    onRemove={() => setRemoving(person)}
                                />
                            ))}
                        </ul>
                    )}
                    </>
                ) : (
                    <GroupList />
                )}
            </main>

            {removing && (
                <ConfirmDialog
                    title={`Retirer ${removing.username} de ton carnet ?`}
                    confirmLabel="Retirer du carnet"
                    body={
                        <>
                            <p>
                                Cela ne touche que ton carnet : {removing.username} reste sur vos projets
                                communs, et ton nom ne bouge pas de son côté.
                            </p>
                            {removing.sharedProjects.length > 0 && (
                                <p className="mt-2 text-slate-400">
                                    Vous partagez {removing.sharedProjects.length} projet
                                    {removing.sharedProjects.length > 1 ? 's' : ''} : l’ajouter à nouveau
                                    par email le fera revenir.
                                </p>
                            )}
                        </>
                    }
                    onCancel={() => setRemoving(null)}
                    onConfirm={async () => {
                        await removeContact(removing)
                        setRemoving(null)
                    }}
                />
            )}
        </div>
    )
}
