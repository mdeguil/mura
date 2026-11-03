import { useState } from 'react'

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

    async function confirm() {
        setBusy(true)
        try {
            await onConfirm()
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-lg overflow-hidden">
                <span className={`block h-1.5 ${tone === 'danger' ? 'bg-red-500' : 'bg-brand-500'}`} />

                <div className="px-6 pt-5 pb-4">
                    <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
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
                        className={`h-9 px-4 rounded-lg text-sm font-medium text-white transition disabled:opacity-60 ${
                            tone === 'danger'
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-brand-500 hover:bg-brand-600'
                        }`}
                    >
                        {busy ? 'En cours…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
