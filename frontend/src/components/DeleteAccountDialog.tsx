import { useEffect, useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import type { Account, AccountDeletionPreview } from '../types'

export default function DeleteAccountDialog({
    account,
    onClose,
    onDeleted,
}: {
    account: Account
    onClose: () => void
    onDeleted: () => void
}) {
    // Worked out by the server before anything happens, so the list below is
    // what will actually occur rather than a warning in the abstract.
    const [preview, setPreview] = useState<AccountDeletionPreview | null>(null)
    const [typed, setTyped] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let cancelled = false

        api.get<AccountDeletionPreview>(`/admin/accounts/${account.id}/deletion-preview`)
            .then(({ data }) => {
                if (!cancelled) setPreview(data)
            })
            .catch((err) => {
                if (!cancelled) setError(apiErrorMessage(err, 'Impossible de préparer la suppression.'))
            })

        return () => {
            cancelled = true
        }
    }, [account.id])

    // Typing the name back is the whole safeguard: nothing here can be undone.
    const matches = typed.trim() === account.username

    async function confirm() {
        if (!matches) return

        setError('')
        setLoading(true)
        try {
            await api.delete(`/admin/accounts/${account.id}`)
            onDeleted()
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de supprimer ce compte.'))
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-surface border border-border rounded-2xl w-full max-w-lg shadow-lg overflow-hidden">
                <span className="block h-1.5 bg-red-500" />

                <div className="px-6 pt-5 pb-4 border-b border-border">
                    <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                        <span aria-hidden="true">🗑️</span>
                        Supprimer le compte de {account.username} ?
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">Cette action est irréversible.</p>
                </div>

                <div className="px-6 py-5 max-h-[50vh] overflow-y-auto">
                    {!preview && !error && <p className="text-sm text-slate-500">Vérification en cours…</p>}

                    {preview && (
                        <>
                            {preview.projectsTransferred.length > 0 && (
                                <Section
                                    tone="keep"
                                    title="Ces projets continuent, avec un nouveau propriétaire"
                                >
                                    {preview.projectsTransferred.map((p) => (
                                        <Row key={p.projectName} tone="keep">
                                            <strong className="font-medium">{p.projectName}</strong> revient
                                            à {p.successorUsername}
                                        </Row>
                                    ))}
                                </Section>
                            )}

                            {preview.projectsDeleted.length > 0 && (
                                <Section tone="lose" title="Ces projets disparaissent, personne d’autre n’y est">
                                    {preview.projectsDeleted.map((name) => (
                                        <Row key={name} tone="lose">
                                            <strong className="font-medium">{name}</strong> et toutes ses
                                            tâches
                                        </Row>
                                    ))}
                                </Section>
                            )}

                            {preview.groupsDeleted.length > 0 && (
                                <Section tone="lose" title="Ces groupes disparaissent">
                                    {preview.groupsDeleted.map((name) => (
                                        <Row key={name} tone="lose">
                                            {name}
                                        </Row>
                                    ))}
                                </Section>
                            )}

                            {preview.tasksUnassigned > 0 && (
                                <Section tone="keep" title="Ce qui reste en place">
                                    <Row tone="keep">
                                        {preview.tasksUnassigned} tâche
                                        {preview.tasksUnassigned > 1 ? 's' : ''} qui lui
                                        {preview.tasksUnassigned > 1 ? ' étaient' : ' était'} attribuée
                                        {preview.tasksUnassigned > 1 ? 's' : ''} — elle
                                        {preview.tasksUnassigned > 1 ? 's' : ''} rest
                                        {preview.tasksUnassigned > 1 ? 'ent' : 'e'}, sans responsable
                                    </Row>
                                </Section>
                            )}

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault()
                                    confirm()
                                }}
                                className="mt-5"
                            >
                                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                    Tape « {account.username} » pour confirmer
                                </label>
                                <input
                                    type="text"
                                    value={typed}
                                    onChange={(e) => setTyped(e.target.value)}
                                    autoFocus
                                    className="w-full h-10 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 outline-none focus:border-red-400 transition"
                                />
                            </form>
                        </>
                    )}

                    {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
                </div>

                <div className="px-6 py-4 border-t border-border bg-surface-muted/60 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface transition"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={confirm}
                        disabled={!matches || loading || !preview}
                        className="h-9 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-40 disabled:hover:bg-red-500"
                    >
                        {loading ? 'Suppression…' : 'Supprimer définitivement'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function Section({
    title,
    tone,
    children,
}: {
    title: string
    tone: 'keep' | 'lose'
    children: React.ReactNode
}) {
    return (
        <div className="mb-4 last:mb-0">
            <p
                className={`text-xs font-medium mb-1.5 ${
                    tone === 'lose' ? 'text-red-600' : 'text-slate-600'
                }`}
            >
                {title}
            </p>
            <ul className="flex flex-col gap-1">{children}</ul>
        </div>
    )
}

function Row({ tone, children }: { tone: 'keep' | 'lose'; children: React.ReactNode }) {
    return (
        <li className="flex gap-2 text-sm text-slate-600">
            <span className={tone === 'lose' ? 'text-red-500' : 'text-emerald-500'} aria-hidden="true">
                {tone === 'lose' ? '✕' : '→'}
            </span>
            <span>{children}</span>
        </li>
    )
}
