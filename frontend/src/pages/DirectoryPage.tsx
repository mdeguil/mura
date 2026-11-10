import { useTranslation } from 'react-i18next'
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
    const { t } = useTranslation()
    const peopleQuery = useApiQuery<KnownUser[]>('/directory', [], t('directory.errors.load'))
    const { data: people, setData: setPeople, loading } = peopleQuery
    const requestsQuery = useApiQuery<KnownUser[]>(
        '/directory/requests',
        [],
        t('directory.errors.requests')
    )
    const { data: requests, setData: setRequests } = requestsQuery
    const projectsQuery = useApiQuery<Project[]>('/projects', [], t('directory.errors.projects'))
    const projects = projectsQuery.data
    const loadFailures = [peopleQuery, requestsQuery, projectsQuery]
        .filter((q) => q.error)
        .map((q) => ({ message: q.error, retry: q.reload }))
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
    const [ascending, setAscending] = useState(true)

    async function acceptRequest(person: KnownUser) {
        setError('')
        try {
            const { data } = await api.post<KnownUser>(`/directory/requests/${person.id}/accept`)
            setRequests((prev) => prev.filter((r) => r.id !== person.id))
            setPeople((prev) => [data, ...prev.filter((p) => p.id !== data.id)])
        } catch (err) {
            setError(apiErrorMessage(err, t('directory.errors.accept')))
        }
    }

    async function declineRequest(person: KnownUser) {
        setError('')
        try {
            await api.post(`/directory/requests/${person.id}/decline`)
            setRequests((prev) => prev.filter((r) => r.id !== person.id))
        } catch (err) {
            setError(apiErrorMessage(err, t('directory.errors.decline')))
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
            setFormError(apiErrorMessage(err, t('directory.errors.add')))
        } finally {
            setSaving(false)
        }
    }

    async function removeContact(person: KnownUser) {
        setFormError('')
        try {
            await api.delete(`/directory/${person.id}`)
            setPeople((prev) => prev.filter((p) => p.id !== person.id))
        } catch (err) {
            setFormError(apiErrorMessage(err, t('directory.errors.remove')))
        }
    }

    async function toggleFavourite(person: KnownUser) {
        const next = !person.favourite
        setPeople((prev) => prev.map((p) => (p.id === person.id ? { ...p, favourite: next } : p)))
        try {
            await api.put(`/directory/${person.id}/favourite`, { favourite: next })
        } catch (err) {
            setPeople((prev) =>
                prev.map((p) => (p.id === person.id ? { ...p, favourite: !next } : p))
            )
            setFormError(apiErrorMessage(err, t('directory.errors.favourite')))
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
                        <h1 className="text-2xl font-semibold text-slate-800">{t('directory.title')}</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {t('directory.subtitle')}
                        </p>
                    </div>
                    {tab === 'people' && (
                        <button
                            onClick={() => setAdding((v) => !v)}
                            className="h-9 px-4 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition shrink-0"
                        >
                            {adding ? t('common.cancel') : t('directory.addPerson')}
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-6 border-b border-border mb-5 overflow-x-auto overflow-y-hidden">
                    {[
                        { key: 'people' as const, label: t('directory.people'), count: people.length },
                        { key: 'groups' as const, label: t('directory.groups'), count: null },
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
                                {t('directory.email')}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
                                    placeholder={t('directory.emailPlaceholder')}
                                    required
                                    autoFocus
                                    className="flex-1 min-w-0 h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                                />
                                <button
                                    type="submit"
                                    disabled={saving || !email.trim()}
                                    className="h-9 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-ink text-xs font-medium transition disabled:opacity-60 shrink-0"
                                >
                                    {saving ? t('directory.adding') : t('directory.add')}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5">
                                {t('directory.addHint')}
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
                                placeholder={t('directory.search')}
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
                            {t('directory.favouritesOnly')}
                            <span className="text-slate-400 font-normal">
                                {people.filter((p) => p.favourite).length}
                            </span>
                        </button>
                        <button
                            onClick={() => setAscending((v) => !v)}
                            className="h-9 px-3 rounded-lg border border-border-strong bg-surface text-slate-600 hover:border-brand-500 text-xs font-medium transition flex items-center gap-1.5"
                            title={
                                ascending
                                    ? t('directory.sortedAsc')
                                    : t('directory.sortedDesc')
                            }
                        >
                            <span aria-hidden="true">{ascending ? '↓' : '↑'}</span>
                            {ascending ? 'A → Z' : 'Z → A'}
                        </button>
                    </div>
                    {requests.length > 0 && (
                        <section className="mb-5">
                            <h2 className="text-xs font-medium text-slate-600 mb-2">
                                {t('directory.requests', { count: requests.length })}
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
                                                {t('directory.wantsToAdd')}
                                                {person.sharedProjects.length > 0 &&
                                                    t('directory.sharedProjects', { count: person.sharedProjects.length })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => declineRequest(person)}
                                                className="h-8 px-3 rounded-lg border border-border-strong text-xs font-medium text-slate-600 hover:border-red-400 hover:text-red-600 transition"
                                            >
                                                {t('directory.decline')}
                                            </button>
                                            <button
                                                onClick={() => acceptRequest(person)}
                                                className="h-8 px-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition"
                                            >
                                                {t('directory.accept')}
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {loading ? (
                        <div className="text-sm text-slate-500">{t('common.loading')}</div>
                    ) : peopleQuery.error ? (
                        null
                    ) : people.length === 0 ? (
                        <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                            <div className="w-14 h-14 rounded-2xl bg-brand-gradient-diagonal flex items-center justify-center mb-4">
                                <span className="text-white text-2xl">📇</span>
                            </div>
                            <h2 className="text-base font-semibold text-slate-800 mb-1">
                                {t('directory.empty')}
                            </h2>
                            <p className="text-sm text-slate-500 max-w-sm">
                                {t('directory.emptyHint')}
                            </p>
                        </div>
                    ) : shown.length === 0 ? (
                        <div className="bg-surface border border-border rounded-2xl py-16 px-6 text-center">
                            <h2 className="text-base font-semibold text-slate-800 mb-1">
                                {t('directory.noResult', { query })}
                            </h2>
                            <p className="text-sm text-slate-500">{t('directory.noResultHint')}</p>
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
                    title={t('directory.removeTitle', { name: removing.username })}
                    confirmLabel={t('directory.removeConfirm')}
                    body={
                        <>
                            <p>
                                {t('directory.removeBody', { name: removing.username })}
                            </p>
                            {removing.sharedProjects.length > 0 && (
                                <p className="mt-2 text-slate-400">
                                    {t('directory.removeShared', { count: removing.sharedProjects.length })}
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
