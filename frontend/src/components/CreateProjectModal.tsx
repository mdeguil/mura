import { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import type { Project, ProjectType } from '../types'
import { projectGlassBackground } from '../utils/color'
import { PROJECT_TYPE_LABELS } from '../utils/projectMeta'

const COLORS = ['#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#22c55e']
const TYPES = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]

const FIELD =
    'w-full h-10 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition'
const LABEL = 'block text-xs font-medium text-slate-600 mb-1.5'

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
            setError('« ' + email + " » n'est pas une adresse email.")
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
            <div className="bg-surface border border-border rounded-2xl w-full max-w-2xl shadow-lg max-h-[90vh] flex flex-col overflow-hidden">
                {/* The chosen colour sits across the top, so the swatch row
                    below has something to answer to. */}
                <span
                    className="h-1.5 shrink-0"
                    style={{ background: projectGlassBackground(color) }}
                />

                <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
                    <h2 className="text-base font-semibold text-slate-800">Créer un projet</h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                        Donne-lui un nom, et invite déjà celles et ceux qui vont y travailler.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
                    <div className="px-6 py-5 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                        {/* Left: what the project is. Right: how it looks and
                            who is on it. */}
                        <div className="flex flex-col gap-5">
                            <div>
                                <label className={LABEL}>Nom</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Mon nouveau projet"
                                    required
                                    maxLength={255}
                                    autoFocus
                                    className={FIELD}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className={LABEL}>Type</label>
                                    <select
                                        value={type}
                                        onChange={(e) => setType(e.target.value as ProjectType)}
                                        className={FIELD}
                                    >
                                        {TYPES.map((t) => (
                                            <option key={t} value={t}>
                                                {PROJECT_TYPE_LABELS[t]}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL}>Date de début</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className={FIELD}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={LABEL}>Description (optionnel)</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="De quoi parle ce projet ?"
                                    rows={5}
                                    maxLength={2000}
                                    className="w-full rounded-lg border border-border-strong bg-surface-muted px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            <div>
                                <label className={LABEL}>Couleur</label>
                                <div className="flex gap-2">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setColor(c)}
                                            style={{ background: projectGlassBackground(c) }}
                                            className={`w-8 h-8 rounded-full transition ${
                                                color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                                            }`}
                                            aria-label={c}
                                            aria-pressed={color === c}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={LABEL}>Inviter des personnes (optionnel)</label>

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
                                        className={`${FIELD} flex-1 min-w-0`}
                                    />
                                    <button
                                        type="button"
                                        onClick={addEmail}
                                        disabled={!emailDraft.trim()}
                                        className="w-10 h-10 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-lg leading-none transition disabled:opacity-40 shrink-0"
                                        aria-label="Ajouter cette personne à la liste"
                                    >
                                        +
                                    </button>
                                </div>

                                {invitedEmails.length > 0 ? (
                                    <ul className="flex flex-wrap gap-1.5 mt-2.5">
                                        {invitedEmails.map((email) => (
                                            <li
                                                key={email}
                                                className="flex items-center gap-1.5 bg-surface-muted border border-border rounded-full pl-2.5 pr-1.5 py-1"
                                            >
                                                <span className="text-xs text-slate-600">{email}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setInvitedEmails((prev) =>
                                                            prev.filter((e) => e !== email)
                                                        )
                                                    }
                                                    className="text-slate-300 hover:text-red-500 transition text-xs leading-none"
                                                    aria-label={`Retirer ${email}`}
                                                >
                                                    ✕
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-slate-400 mt-2">
                                        Elles recevront une invitation et rejoindront le projet si elles
                                        l'acceptent.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-t border-border bg-surface-muted/60 flex items-center justify-between gap-4 shrink-0">
                        <p className="text-xs text-red-500 min-w-0">{error}</p>
                        <div className="flex gap-2 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface transition"
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                            >
                                {loading ? 'Création…' : 'Créer le projet'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
