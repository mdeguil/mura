import { useEffect, useMemo, useRef, useState } from 'react'
import { useApiQuery } from '../hooks/useApiQuery'
import UserAvatar from './UserAvatar'
import type { KnownUser } from '../types'

// Eight is what fits without the list becoming a page of its own. A carnet
// of a hundred people is the case this exists for, and scrolling a hundred
// faces is the thing it is meant to replace.
const MAX_SUGGESTIONS = 8

/**
 * The invite field, with the carnet behind it. Typing two letters of a name
 * is quicker than recalling an address and quicker than picking a face out
 * of a long list -- and the field still takes an address nobody has met
 * yet. Suggestions starting with what was typed come first; the arrows and
 * Enter pick one, Escape closes the list before anything else.
 *
 * @param props the field's value, who not to offer, and the callbacks
 */
export default function CarnetCombobox({
    value,
    onChange,
    onPick,
    excludeIds = [],
    excludeEmails = [],
    placeholder = 'Nom ou email…',
    autoFocus = false,
    onEscape,
    className = '',
    id,
}: {
    /** What the field holds. */
    value: string
    /** Called as the reader types. */
    onChange: (value: string) => void
    /** Called with the person picked from the list. */
    onPick: (person: KnownUser) => void
    /** People not to suggest, by id. */
    excludeIds?: string[]
    /** People not to suggest, by address. */
    excludeEmails?: string[]
    /** The field's placeholder. */
    placeholder?: string
    /** Takes the focus when it appears. */
    autoFocus?: boolean
    /** Called on Escape when the list is already closed. */
    onEscape?: () => void
    /** Classes for the wrapper. */
    className?: string
    /** For a `<label htmlFor>` outside the field. */
    id?: string
}) {
    // Suggestions only: if the carnet cannot be read, the field still takes
    // a typed address, so a failure here is not worth interrupting anyone.
    const { data: people } = useApiQuery<KnownUser[]>('/directory', [], '')
    const [open, setOpen] = useState(false)
    const [highlighted, setHighlighted] = useState(0)
    const wrapper = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return

        function onPointerDown(event: MouseEvent) {
            if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onPointerDown)
        return () => document.removeEventListener('mousedown', onPointerDown)
    }, [open])

    const reachable = useMemo(
        () =>
            people
                // A request still waiting for an answer is not somebody you
                // can reach yet, and an entry seen through an invitation
                // hides its address until the person joins.
                .filter((person) => !person.pending && person.email)
                .filter((person) => !excludeIds.includes(person.id))
                .filter((person) => !excludeEmails.includes(person.email!.toLowerCase())),
        [people, excludeIds, excludeEmails]
    )

    const query = value.trim().toLowerCase()
    const matches = useMemo(() => {
        if (query === '') {
            // Nothing typed: a short carnet is worth showing outright, a long
            // one would just be the wall of names this replaced.
            return reachable.length <= MAX_SUGGESTIONS ? reachable : []
        }
        return reachable
            .filter(
                (person) =>
                    person.username.toLowerCase().includes(query) ||
                    person.email!.toLowerCase().includes(query)
            )
            // A name that starts with what you typed is the one you meant.
            .sort((a, b) => {
                const aStarts = a.username.toLowerCase().startsWith(query) ? 0 : 1
                const bStarts = b.username.toLowerCase().startsWith(query) ? 0 : 1
                return aStarts - bStarts || a.username.localeCompare(b.username, 'fr')
            })
            .slice(0, MAX_SUGGESTIONS)
    }, [reachable, query])

    // The highlight has to stay on a row that still exists as you type.
    useEffect(() => {
        setHighlighted(0)
    }, [query])

    const showing = open && matches.length > 0

    function choose(person: KnownUser) {
        setOpen(false)
        onPick(person)
    }

    function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Escape') {
            if (showing) {
                event.stopPropagation()
                setOpen(false)
                return
            }
            onEscape?.()
            return
        }
        if (!showing) return

        if (event.key === 'ArrowDown') {
            event.preventDefault()
            setHighlighted((i) => (i + 1) % matches.length)
        } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setHighlighted((i) => (i - 1 + matches.length) % matches.length)
        } else if (event.key === 'Enter') {
            // Picking the highlighted row rather than submitting whatever
            // half-typed text is in the field.
            event.preventDefault()
            choose(matches[highlighted])
        }
    }

    return (
        <div ref={wrapper} className={`relative ${className}`}>
            <input
                id={id}
                type="text"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value)
                    setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                autoFocus={autoFocus}
                autoComplete="off"
                role="combobox"
                aria-expanded={showing}
                aria-autocomplete="list"
                aria-controls="carnet-suggestions"
                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
            />

            {showing && (
                <ul
                    id="carnet-suggestions"
                    role="listbox"
                    className="absolute left-0 right-0 top-10 z-50 bg-surface border border-border rounded-xl shadow-lg p-1.5 flex flex-col gap-0.5 max-h-64 overflow-y-auto"
                >
                    {matches.map((person, index) => (
                        <li key={person.id}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={index === highlighted}
                                // Mouse down rather than click: the input
                                // blurring first would close the list out from
                                // under the pointer.
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    choose(person)
                                }}
                                onMouseEnter={() => setHighlighted(index)}
                                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition ${
                                    index === highlighted ? 'bg-surface-muted' : ''
                                }`}
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
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
