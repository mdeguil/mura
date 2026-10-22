import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import UserAvatar from './UserAvatar'
import { anchoredStyle, useAnchoredMenu } from '../hooks/useAnchoredMenu'
import type { KnownUser } from '../types'

// Picking somebody you already know should not mean recalling their
// address. A datalist only helps once you have started typing the thing you
// were trying to avoid typing; this shows the faces.
export default function CarnetPicker({
    onPick,
    excludeIds = [],
    excludeEmails = [],
    label = 'Depuis mon carnet',
}: {
    onPick: (person: KnownUser) => void
    // Already a member, or already on the list about to be invited.
    excludeIds?: string[]
    excludeEmails?: string[]
    label?: string
}) {
    const [open, setOpen] = useState(false)
    const [people, setPeople] = useState<KnownUser[]>([])
    const [loaded, setLoaded] = useState(false)
    const [query, setQuery] = useState('')
    const close = useCallback(() => setOpen(false), [])
    const { wrapper, trigger, position } = useAnchoredMenu({
        open,
        onClose: close,
        minWidth: 272,
        maxHeight: 300,
    })

    // Fetched the first time it is opened rather than on mount: most visits
    // to a project never touch this button.
    useEffect(() => {
        if (!open || loaded) return
        let cancelled = false

        api.get<KnownUser[]>('/directory')
            .then(({ data }) => {
                if (!cancelled) setPeople(data)
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setLoaded(true)
            })

        return () => {
            cancelled = true
        }
    }, [open, loaded])

    const available = useMemo(() => {
        const q = query.trim().toLowerCase()
        return people
            // A request still waiting for an answer is not someone you can
            // reach yet, and an entry seen through an invitation hides its
            // address until the person joins.
            .filter((person) => !person.pending && person.email)
            .filter((person) => !excludeIds.includes(person.id))
            .filter((person) => !excludeEmails.includes(person.email!.toLowerCase()))
            .filter(
                (person) =>
                    q === '' ||
                    person.username.toLowerCase().includes(q) ||
                    person.email!.toLowerCase().includes(q)
            )
    }, [people, query, excludeIds, excludeEmails])

    function pick(person: KnownUser) {
        setOpen(false)
        setQuery('')
        onPick(person)
    }

    return (
        <div ref={wrapper} className="inline-flex">
            <button
                ref={trigger}
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="h-9 px-3 rounded-lg border border-border-strong bg-surface text-slate-600 hover:border-brand-500 text-xs font-medium transition flex items-center gap-1.5 shrink-0"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <svg
                    viewBox="0 0 24 24"
                    className="w-[15px] h-[15px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 19.5Z" />
                    <path d="M4 8H2M4 12H2M4 16H2" />
                    <circle cx="11.5" cy="10" r="2" />
                    <path d="M8 16a3.5 3.5 0 0 1 7 0" />
                </svg>
                {label}
            </button>

            {open && position && (
                <div
                    role="listbox"
                    style={anchoredStyle(position)}
                    className="overflow-y-auto bg-surface border border-border rounded-xl shadow-lg p-1.5 z-50 flex flex-col gap-1"
                >
                    {people.length > 6 && (
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Rechercher…"
                            autoFocus
                            className="h-8 mb-1 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                        />
                    )}

                    {!loaded ? (
                        <p className="text-xs text-slate-400 px-2 py-1.5">Chargement…</p>
                    ) : available.length === 0 ? (
                        <p className="text-xs text-slate-400 px-2 py-1.5">
                            {people.length === 0
                                ? 'Ton carnet est vide.'
                                : query.trim()
                                  ? 'Personne ne correspond.'
                                  : 'Tout ton carnet est déjà sur ce projet.'}
                        </p>
                    ) : (
                        available.map((person) => (
                            <button
                                key={person.id}
                                type="button"
                                role="option"
                                aria-selected={false}
                                onClick={() => pick(person)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-surface-muted transition"
                            >
                                <UserAvatar user={{ ...person, email: person.email }} />
                                <span className="min-w-0">
                                    <span className="block text-xs text-slate-700 truncate">
                                        {person.username}
                                        {person.suspended && (
                                            <span className="text-red-500"> · suspendu</span>
                                        )}
                                    </span>
                                    <span className="block text-[10px] text-slate-400 truncate">
                                        {person.email}
                                    </span>
                                </span>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
