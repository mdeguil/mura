import { useCallback, useState } from 'react'
import { anchoredStyle, useAnchoredMenu } from '../hooks/useAnchoredMenu'
import UserAvatar from './UserAvatar'
import type { Member } from '../types'

// The same idea as the project status badge: the pill that states who is in
// charge is also the control that changes it, so naming a responsable no
// longer means opening a form and picking a line out of a dropdown.
export default function AssigneePicker({
    members,
    value,
    onChange,
    disabled,
    // The create form wants a field that lines up with its other inputs.
    fullWidth = false,
}: {
    members: Member[]
    value: string | null
    onChange: (assigneeId: string | null) => void | Promise<void>
    disabled?: boolean
    fullWidth?: boolean
}) {
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const close = useCallback(() => setOpen(false), [])
    const { wrapper, trigger, position } = useAnchoredMenu({ open, onClose: close })
    const current = members.find((m) => m.id === value) ?? null

    async function pick(next: string | null) {
        setOpen(false)
        if (next === value) return

        setSaving(true)
        try {
            await onChange(next)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className={`relative ${fullWidth ? 'w-full' : ''}`} ref={wrapper}>
            <button
                type="button"
                ref={trigger}
                onClick={() => setOpen((v) => !v)}
                disabled={disabled || saving}
                className={`${
                    fullWidth ? 'w-full h-9 justify-between px-2.5' : 'h-7 pl-1 pr-2.5'
                } flex items-center gap-1.5 rounded-full border text-xs font-medium transition disabled:opacity-60 ${
                    current
                        ? 'border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100'
                        : 'border-dashed border-border-strong bg-surface-muted text-slate-500 hover:border-brand-500'
                }`}
                title="Choisir le responsable"
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="flex items-center gap-1.5 min-w-0">
                    {current ? (
                        <>
                            <UserAvatar user={current} size="sm" />
                            <span className="truncate">{current.username}</span>
                        </>
                    ) : (
                        <>
                            <PersonIcon />
                            <span>Personne</span>
                        </>
                    )}
                </span>
                <span className="text-[9px] leading-none opacity-60">▾</span>
            </button>

            {open && position && (
                <div
                    role="listbox"
                    style={anchoredStyle(position)}
                    className="overflow-y-auto bg-surface border border-border rounded-xl shadow-lg p-1.5 z-50 flex flex-col gap-1"
                >
                    <Option selected={value === null} onPick={() => pick(null)}>
                        <span className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="w-6 h-6 rounded-full border border-dashed border-border-strong flex items-center justify-center">
                                <PersonIcon />
                            </span>
                            Personne
                        </span>
                    </Option>

                    {members.map((member) => (
                        <Option
                            key={member.id}
                            selected={member.id === value}
                            onPick={() => pick(member.id)}
                        >
                            <span className="flex items-center gap-2 min-w-0">
                                <UserAvatar user={member} />
                                <span className="text-xs text-slate-700 truncate">{member.username}</span>
                                {/* Still assignable: a suspension is often brief,
                                    and the task may well be waiting for them. But
                                    whoever picks should know. */}
                                {member.suspended && (
                                    <span className="text-[10px] text-red-500 shrink-0">suspendu</span>
                                )}
                            </span>
                        </Option>
                    ))}
                </div>
            )}
        </div>
    )
}

function Option({
    selected,
    onPick,
    children,
}: {
    selected: boolean
    onPick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            role="option"
            aria-selected={selected}
            onClick={onPick}
            className={`flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-surface-muted transition ${
                selected ? 'bg-surface-muted' : ''
            }`}
        >
            {children}
            {selected && <span className="text-xs text-slate-400 leading-none shrink-0">✓</span>}
        </button>
    )
}

function PersonIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}
