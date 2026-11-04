import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Navbar from '../components/Navbar'
import DeleteOwnAccountDialog from '../components/DeleteOwnAccountDialog'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import { useAuthStore } from '../store/authStore'

/**
 * The account page, at /compte. Where a person exercises the rights the
 * RGPD gives them over their data without having to ask anybody: take a
 * copy of it, or close the account.
 */
export default function AccountPage() {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)
    const [exporting, setExporting] = useState(false)
    const [exportError, setExportError] = useState('')
    const [deleting, setDeleting] = useState(false)

    async function downloadData() {
        setExportError('')
        setExporting(true)
        try {
            const { data } = await api.get<Blob>('/auth/me/export', { responseType: 'blob' })
            // Handed to the browser as a file rather than shown: it is
            // meant to be kept, and reused elsewhere.
            const url = URL.createObjectURL(data)
            const link = document.createElement('a')
            link.href = url
            link.download = 'mes-donnees-mura.json'
            link.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            setExportError(apiErrorMessage(err, 'Impossible de préparer tes données. Réessaie.'))
        } finally {
            setExporting(false)
        }
    }

    function handleDeleted() {
        logout()
        navigate('/login', { replace: true })
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-app">
            <Navbar />

            <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">Mon compte</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Ce que Mura sait de toi, et ce que tu peux en faire. Le détail est dans la{' '}
                        <Link to="/confidentialite" className="text-brand-700 underline underline-offset-2">
                            politique de confidentialité
                        </Link>
                        .
                    </p>
                </div>

                <section className="bg-surface border border-border rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-800 mb-3">Ton compte</h2>
                    <dl className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
                        <dt className="text-slate-500">Nom d'utilisateur</dt>
                        <dd className="text-slate-800">{user.username}</dd>
                        <dt className="text-slate-500">Adresse e-mail</dt>
                        <dd className="text-slate-800 break-all">{user.email}</dd>
                        <dt className="text-slate-500">Créé le</dt>
                        <dd className="text-slate-800">
                            {format(new Date(user.createdAt), 'd MMMM yyyy', { locale: fr })}
                        </dd>
                    </dl>
                </section>

                <section className="bg-surface border border-border rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-800 mb-1">Tes données</h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Un fichier avec tout ce que Mura conserve sur toi : ton compte, tes projets, les tâches
                        qui te sont confiées, tes groupes, ton carnet, tes invitations et tes notifications.
                    </p>
                    <button
                        onClick={downloadData}
                        disabled={exporting}
                        className="h-9 px-4 rounded-lg border border-border-strong text-sm font-medium text-slate-700 hover:bg-surface-muted transition disabled:opacity-60"
                    >
                        {exporting ? 'Préparation…' : 'Télécharger mes données'}
                    </button>
                    {exportError && (
                        <p role="alert" className="text-xs text-red-600 mt-3">
                            {exportError}
                        </p>
                    )}
                </section>

                <section className="bg-surface border border-red-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-800 mb-1">Supprimer mon compte</h2>
                    <p className="text-sm text-slate-500 mb-4">
                        Ton compte et ce qui n'appartient qu'à toi disparaissent pour de bon. Les projets que
                        tu partages passent à un autre membre ; tu verras le détail avant de confirmer.
                    </p>
                    <button
                        onClick={() => setDeleting(true)}
                        className="h-9 px-4 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium transition"
                    >
                        Supprimer mon compte…
                    </button>
                </section>
            </main>

            {deleting && <DeleteOwnAccountDialog onClose={() => setDeleting(false)} onDeleted={handleDeleted} />}
        </div>
    )
}
