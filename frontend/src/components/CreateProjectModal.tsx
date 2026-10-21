import { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import type { Project, ProjectType } from '../types'
import { projectGlassBackground } from '../utils/color'
import { PROJECT_TYPE_LABELS } from '../utils/projectMeta'

const COLORS = ['#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#22c55e']
const TYPES = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]

export default function CreateProjectModal({
    onClose,
    onCreated,
}: {
    onClose: () => void
    onCreated: (project: Project) => void
}) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState(COLORS[0])
    const [type, setType] = useState<ProjectType>('AUTRE')
    const [startDate, setStartDate] = useState('')
    const [invitedEmails, setInvitedEmails] = useState<string[]>([])
    const [emailDraft, setEmailDraft] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    // The draft field is not a form field of its own — Entrée adds it to the
    // list rather than submitting the project half-filled.
    function addEmail() {
        const email = emailDraft.trim().toLowerCase()
        if (!email) return
        if (!email.includes('@')) {
            setError("« " + email + " » n'est pas une adresse email.")
            return
        }
        setError('')
        setEmailDraft('')
        setInvitedEmails((prev) => (prev.includes(email) ? prev : [...prev, email]))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data } = await api.post<Project>('/projects', {
                name,
                description,
                color,
                type,
                startDate: startDate || null,
                invitedEmails,
            })
            onCreated(data)
            onClose()
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de créer le projet. Réessaie.'))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
            <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-lg">
                <h2 className="text-base font-semibold text-slate-800 mb-4">Créer un projet</h2>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Mon nouveau projet"
                            required
                            maxLength={255}
                            autoFocus
                            className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Type</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as ProjectType)}
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                            >
                                {TYPES.map((t) => (
                                    <option key={t} value={t}>
                                        {PROJECT_TYPE_LABELS[t]}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Date de début</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Description (optionnel)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="De quoi parle ce projet ?"
                            rows={2}
                            maxLength={2000}
                            className="w-full rounded-lg border border-border-strong bg-surface-muted px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">
                            Inviter des personnes (optionnel)
                        </label>

                        {invitedEmails.length > 0 && (
                            <ul className="flex flex-wrap gap-1.5 mb-2">
                                {invitedEmails.map((email) => (
                                    <li
                                        key={email}
                                        className="flex items-center gap-1.5 bg-surface-muted border border-border rounded-full pl-2.5 pr-1.5 py-1"
                                    >
                                        <span className="text-xs text-slate-600">{email}</span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setInvitedEmails((prev) => prev.filter((e) => e !== email))
                                            }
                                            className="text-slate-300 hover:text-red-500 transition text-xs leading-none"
                                            aria-label={`Retirer ${email}`}
                                        >
                                            ✕
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={emailDraft}
                                onChange={(e) => setEmailDraft(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        addEmail()
                                    }
                                }}
                                placeholder="prenom@exemple.com"
                                className="flex-1 min-w-0 h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                            />
                            <button
                                type="button"
                                onClick={addEmail}
                                disabled={!emailDraft.trim()}
                                className="w-9 h-9 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-base leading-none transition disabled:opacity-40 shrink-0"
                                aria-label="Ajouter cette personne à la liste"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-xs text-slate-400 mt-1.5">
                            Elles recevront une invitation et rejoindront le projet si elles l'acceptent.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1.5">Couleur</label>
                        <div className="flex gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    style={{ background: projectGlassBackground(c) }}
                                    className={`w-7 h-7 rounded-full transition ${
                                        color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                                    }`}
                                    aria-label={c}
                                />
                            ))}
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                    )}

                    <div className="flex justify-end gap-2 mt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface-muted transition"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                        >
                            {loading ? 'Création…' : 'Créer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
