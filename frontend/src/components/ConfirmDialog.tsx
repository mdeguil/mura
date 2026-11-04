import { useId, useState } from 'react'
import Modal from './Modal'

// A browser confirm cannot name what is at stake, cannot be styled, and
// cannot say what will survive the action. This can.
export default function ConfirmDialog({
    title,
    body,
    confirmLabel,
    icon,
    tone = 'danger',
    onCancel,
    onConfirm,
}: {
    title: string
    body: React.ReactNode
    confirmLabel: string
    // Carried into the heading, where it is doing the work of a warning.
    icon?: string
    tone?: 'danger' | 'neutral'
    onCancel: () => void
    onConfirm: () => void | Promise<void>
}) {
    const [busy, setBusy] = useState(false)
    const titleId = useId()

    async function confirm() {
        setBusy(true)
        try {
            await onConfirm()
        } finally {
            setBusy(false)
        }
    }

    return (
        <Modal labelledBy={titleId} onClose={onCancel} size="md" className="overflow-hidden">
            <span className={`block h-1.5 ${tone === 'danger' ? 'bg-red-500' : 'bg-brand-500'}`} />

            <div className="px-6 pt-5 pb-4">
                <h2 id={titleId} className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    {icon && <span aria-hidden="true">{icon}</span>}
                    {title}
                </h2>
                <div className="text-sm text-slate-500 mt-2">{body}</div>
            </div>

            <div className="px-6 py-4 border-t border-border bg-surface-muted/60 flex justify-end gap-2">
                <button
                    onClick={onCancel}
                    className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface transition"
                >
                    Annuler
                </button>
                <button
                    onClick={confirm}
                    disabled={busy}
                    className={`h-9 px-4 rounded-lg text-sm font-medium transition disabled:opacity-60 ${
                        tone === 'danger'
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-brand-500 hover:bg-brand-600 text-ink'
                    }`}
                >
                    {busy ? 'En cours…' : confirmLabel}
                </button>
            </div>
        </Modal>
    )
}
