import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import UserAvatar from '../components/UserAvatar'
import GroupList from '../components/GroupList'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import { useAuthStore } from '../store/authStore'
import type { KnownUser } from '../types'
import { projectGlassBackground } from '../utils/color'

export default function DirectoryPage() {
    const [people, setPeople] = useState<KnownUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [query, setQuery] = useState('')
    const [tab, setTab] = useState<'people' | 'groups'>('people')
    const currentUserId = useAuthStore((s) => s.user?.id) ?? ''

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

    const [adding, setAdding] = useState(false)
    const [email, setEmail] = useState('')
    const [formError, setFormError] = useState('')
    const [saving, setSaving] = useState(false)
    const [removing, setRemoving] = useState<KnownUser | null>(null)
    const [favouritesOnly, setFavouritesOnly] = useState(false)
    // Favourites stay on top whichever way this points: the star is a
    // decision about importance, the sort only orders what is left.
    const [ascending, setAscending] = useState(true)

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
                            className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition shrink-0"
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
                                    className="h-9 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition disabled:opacity-60 shrink-0"
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

                    {error && (
                        <div className="mb-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                            {error}
                        </div>
                    )}

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
                                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                                        <span className="text-xs text-slate-400">
                                            {person.sharedProjects.length > 0
                                                ? `${person.sharedProjects.length} projet${person.sharedProjects.length > 1 ? 's' : ''}`
                                                : person.saved
                                                  ? 'Ajouté'
                                                  : 'Invitation'}
                                        </span>
                                        <button
                                            onClick={() => toggleFavourite(person)}
                                            aria-pressed={person.favourite}
                                            className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl leading-none transition ${
                                                person.favourite
                                                    ? 'text-amber-400 hover:bg-amber-50'
                                                    : 'text-slate-300 hover:text-amber-400 hover:bg-surface-muted'
                                            }`}
                                            title={
                                                person.favourite
                                                    ? 'Retirer des favoris'
                                                    : 'Mettre en favori'
                                            }
                                            aria-label={
                                                person.favourite
                                                    ? `Retirer ${person.username} des favoris`
                                                    : `Mettre ${person.username} en favori`
                                            }
                                        >
                                            {person.favourite ? '★' : '☆'}
                                        </button>
                                        <button
                                            onClick={() => setRemoving(person)}
                                            className="w-9 h-9 rounded-lg flex items-center justify-center text-base leading-none text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                                            title="Retirer de mon carnet"
                                            aria-label={`Retirer ${person.username} de mon carnet`}
                                        >
                                            🗑
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                    </>
                ) : (
                    <GroupList currentUserId={currentUserId} carnet={people} />
                )}
            </main>

            {removing && (
                <ConfirmDialog
                    icon="🗑"
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
