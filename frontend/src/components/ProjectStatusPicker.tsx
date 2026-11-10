import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import type { ProjectStatus } from '../types'
import { PROJECT_STATUS_CLASSES, PROJECT_STATUS_LABELS } from '../utils/projectMeta'

const STATUSES = Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]

/**
 * A project's status badge, which opens the list of statuses when clicked.
 * The badge was already the clearest statement of where a project stands;
 * making it the control too means changing it no longer sends anyone
 * through a form.
 *
 * @param props the status, whether it may be changed and what to do on a change
 */
export default function ProjectStatusPicker({
    status,
    canEdit,
    onChange,
}: {
    /** The project's current status. */
    status: ProjectStatus
    /** Whether the badge opens the list; a plain badge otherwise. */
    canEdit: boolean
    /** Called with the status picked. */
    onChange: (status: ProjectStatus) => void
}) {
    const { t } = useTranslation()
    const [open, setOpen] = useState(false)
    const [saving, setSaving] = useState(false)
    const wrapper = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return

        function onPointerDown(event: MouseEvent) {
            if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
        }
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    const badge = `text-xs font-medium px-2.5 py-1 rounded-full ${PROJECT_STATUS_CLASSES[status]}`

    if (!canEdit) {
        return <span className={badge}>{PROJECT_STATUS_LABELS[status]}</span>
    }

    async function pick(next: ProjectStatus) {
        setOpen(false)
        if (next === status) return

        setSaving(true)
        try {
            await onChange(next)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="relative" ref={wrapper}>
            <button
                onClick={() => setOpen((v) => !v)}
                disabled={saving}
                className={`${badge} flex items-center gap-1.5 hover:brightness-95 transition disabled:opacity-60`}
                title={t('projects.header.changeStatus')}
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                {PROJECT_STATUS_LABELS[status]}
                <span className="text-[9px] leading-none opacity-60">▾</span>
            </button>

            {open && (
                <div
                    role="listbox"
                    className="absolute right-0 top-8 bg-surface border border-border rounded-xl shadow-lg p-1.5 z-50 flex flex-col gap-1"
                >
                    {STATUSES.map((option) => (
                        <button
                            key={option}
                            role="option"
                            aria-selected={option === status}
                            onClick={() => pick(option)}
                            className={`flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg text-left hover:bg-surface-muted transition ${
                                option === status ? 'bg-surface-muted' : ''
                            }`}
                        >
                            <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${PROJECT_STATUS_CLASSES[option]}`}
                            >
                                {PROJECT_STATUS_LABELS[option]}
                            </span>
                            {option === status && (
                                <span className="text-xs text-slate-400 leading-none">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
