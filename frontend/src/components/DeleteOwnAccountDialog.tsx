import { useState } from 'react'
import api from '../services/api'
import { apiErrorField, apiErrorMessage } from '../utils/apiError'
import Modal from './Modal'
import PasswordInput from './PasswordInput'
import { useApiQuery } from '../hooks/useApiQuery'
import { DeletionConsequences } from './DeleteAccountDialog'
import type { AccountDeletionPreview } from '../types'

// Closing one's own account. The same consequences an administrator is
// shown, worked out by the server; the password is what confirms it.
export default function DeleteOwnAccountDialog({
    onClose,
    onDeleted,
}: {
    onClose: () => void
    onDeleted: () => void
}) {
    const { data: preview, error: previewError } = useApiQuery<AccountDeletionPreview | null>(
        '/auth/me/deletion-preview',
        null,
        'Impossible de préparer la suppression.'
    )
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [passwordWrong, setPasswordWrong] = useState(false)
    const [loading, setLoading] = useState(false)

    async function confirm() {
        if (!password) return

        setError('')
        setPasswordWrong(false)
        setLoading(true)
        try {
            await api.delete('/auth/me', { data: { password } })
            onDeleted()
        } catch (err) {
            setPasswordWrong(apiErrorField(err) === 'password')
            setError(apiErrorMessage(err, 'Impossible de supprimer ton compte.'))
            setLoading(false)
        }
    }

    return (
        <Modal labelledBy="delete-own-title" onClose={onClose} size="lg" className="overflow-hidden">
            <span className="block h-1.5 bg-red-500" />

            <div className="px-6 pt-5 pb-4 border-b border-border">
                <h2 id="delete-own-title" className="text-base font-semibold text-slate-800">
                    Supprimer ton compte ?
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">
                    C'est définitif : ni toi ni un administrateur ne pourrez le récupérer. Pense à
                    télécharger tes données avant.
                </p>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    confirm()
                }}
            >
                <div className="px-6 py-5 max-h-[50vh] overflow-y-auto">
                    {!preview && !previewError && <p className="text-sm text-slate-500">Vérification en cours…</p>}

                    {preview && (
                        <>
                            <DeletionConsequences preview={preview} own />

                            <div className="mt-5">
                                <label
                                    htmlFor="delete-own-password"
                                    className="block text-xs font-medium text-slate-600 mb-1.5"
                                >
                                    Ton mot de passe, pour confirmer
                                </label>
                                <PasswordInput
                                    id="delete-own-password"
                                    value={password}
                                    onChange={setPassword}
                                    autoComplete="current-password"
                                    invalid={passwordWrong}
                                />
                            </div>
                        </>
                    )}

                    {(previewError || error) && (
                        <p role="alert" className="text-xs text-red-600 mt-3">
                            {previewError || error}
                        </p>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-border bg-surface-muted/60 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface transition"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={!password || loading || !preview}
                        className="h-9 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-40 disabled:hover:bg-red-500"
                    >
                        {loading ? 'Suppression…' : 'Supprimer définitivement mon compte'}
                    </button>
                </div>
            </form>
        </Modal>
    )
}
