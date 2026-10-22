import { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import CarnetPicker from './CarnetPicker'
import type { Project } from '../types'
import { projectGlassBackground } from '../utils/color'
import ProjectFormFields, {
    ColorPicker,
    FIELD,
    LABEL,
    PROJECT_COLORS,
    type ProjectFormValues,
} from './ProjectFormFields'

export default function CreateProjectModal({
    onClose,
    onCreated,
}: {
    onClose: () => void
    onCreated: (project: Project) => void
}) {
    const [values, setValues] = useState<ProjectFormValues>({
        name: '',
        description: '',
        color: PROJECT_COLORS[0],
        type: 'AUTRE',
        startDate: '',
    })
    // The address is what the server needs; the name is what the chip
    // should say when the person came from the carnet rather than a
    // keyboard.
    const [invited, setInvited] = useState<{ email: string; username?: string; id?: string }[]>([])
    const [emailDraft, setEmailDraft] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const patch = (p: Partial<ProjectFormValues>) => setValues((prev) => ({ ...prev, ...p }))

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
        add({ email })
    }

    function add(person: { email: string; username?: string; id?: string }) {
        setInvited((prev) =>
            prev.some((p) => p.email === person.email) ? prev : [...prev, person]
        )
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data } = await api.post<Project>('/projects', {
                ...values,
                startDate: values.startDate || null,
                invitedEmails: invited.map((p) => p.email),
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
                    style={{ background: projectGlassBackground(values.color) }}
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
                            <ProjectFormFields values={values} onChange={patch} autoFocus />
                        </div>

                        <div className="flex flex-col gap-5">
                            <ColorPicker color={values.color} onChange={(color) => patch({ color })} />

                            <div>
                                <div className="flex items-center justify-between gap-3 mb-1.5">
                                    <label className={LABEL}>Inviter des personnes (optionnel)</label>
                                    {/* Somebody already in the carnet does not
                                        need their address recalled. */}
                                    <CarnetPicker
                                        onPick={(person) =>
                                            person.email &&
                                            add({
                                                email: person.email.toLowerCase(),
                                                username: person.username,
                                                id: person.id,
                                            })
                                        }
                                        excludeEmails={invited.map((p) => p.email)}
                                    />
                                </div>

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
                                        className="w-10 h-10 rounded-lg bg-brand-500 hover:bg-brand-600 text-white flex items-center justify-center transition disabled:opacity-40 shrink-0"
                                        aria-label="Ajouter cette personne à la liste"
                                    >
                                        <svg
                                            viewBox="0 0 16 16"
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M8 3.5v9M3.5 8h9" />
                                        </svg>
                                    </button>
                                </div>

                                {invited.length > 0 ? (
                                    <ul className="flex flex-wrap gap-1.5 mt-2.5">
                                        {invited.map((person) => (
                                            <li
                                                key={person.email}
                                                className="flex items-center gap-1.5 bg-surface-muted border border-border rounded-full pl-2.5 pr-1.5 py-1"
                                            >
                                                <span
                                                    className="text-xs text-slate-600"
                                                    title={person.email}
                                                >
                                                    {person.username ?? person.email}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setInvited((prev) =>
                                                            prev.filter((p) => p.email !== person.email)
                                                        )
                                                    }
                                                    className="text-slate-300 hover:text-red-500 transition text-xs leading-none"
                                                    aria-label={`Retirer ${person.username ?? person.email}`}
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
