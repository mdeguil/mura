import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Navbar from '../components/Navbar'
import ConfirmDialog from '../components/ConfirmDialog'
import UserAvatar, { SuspendedPill } from '../components/UserAvatar'
import CarnetCombobox from '../components/CarnetCombobox'
import ErrorMessage from '../components/ErrorMessage'
import { useApiQuery } from '../hooks/useApiQuery'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { apiErrorMessage } from '../utils/apiError'
import type { Group, GroupMember } from '../types'

// A group gets a page of its own, like a project: the gérant manages it
// from here rather than from a row in a list, and a member can at least see
// who else is in it.
export default function GroupPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const currentUserId = useAuthStore((s) => s.user?.id) ?? ''

    const {
        data: group,
        setData: setGroup,
        loading,
        error: loadError,
        reload,
    } = useApiQuery<Group | null>(`/groups/${id}`, null, 'Impossible de charger ce groupe.')
    // What went wrong with a change, apart from loading the group.
    const [error, setError] = useState('')

    const [renaming, setRenaming] = useState(false)
    const [name, setName] = useState('')
    const [adding, setAdding] = useState(false)
    const [email, setEmail] = useState('')
    const [busy, setBusy] = useState(false)
    const [removing, setRemoving] = useState<GroupMember | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [leaving, setLeaving] = useState(false)

    async function rename(e: React.FormEvent) {
        e.preventDefault()
        if (!group || !name.trim() || name.trim() === group.name) {
            setRenaming(false)
            return
        }

        setError('')
        try {
            const { data } = await api.put<Group>(`/groups/${group.id}`, { name: name.trim() })
            setGroup(data)
            setRenaming(false)
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de renommer ce groupe.'))
        }
    }

    async function addMember(address: string) {
        if (!group) return

        setError('')
        setBusy(true)
        try {
            const { data } = await api.post<Group>(`/groups/${group.id}/members`, { email: address })
            setGroup(data)
            setEmail('')
            setAdding(false)
        } catch (err) {
            setError(apiErrorMessage(err, "Impossible d'ajouter cette personne."))
        } finally {
            setBusy(false)
        }
    }

    async function setHold(member: GroupMember, onHold: boolean) {
        if (!group) return

        setError('')
        try {
            const { data } = await api.put<Group>(
                `/groups/${group.id}/members/${member.id}/hold`,
                { onHold }
            )
            setGroup(data)
        } catch (err) {
            setError(
                apiErrorMessage(
                    err,
                    onHold ? 'Impossible de mettre cette personne en retrait.' : 'Impossible de la réintégrer.'
                )
            )
        }
    }

    async function removeMember(member: GroupMember) {
        if (!group) return

        setError('')
        try {
            await api.delete(`/groups/${group.id}/members/${member.id}`)
            setGroup({ ...group, members: group.members.filter((m) => m.id !== member.id) })
            setRemoving(null)
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de retirer cette personne.'))
            setRemoving(null)
        }
    }

    async function leave() {
        if (!group) return

        setError('')
        try {
            await api.delete(`/groups/${group.id}/members/${currentUserId}`)
            navigate('/carnet')
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de quitter ce groupe.'))
            setLeaving(false)
        }
    }

    async function removeGroup() {
        if (!group) return

        setError('')
        try {
            await api.delete(`/groups/${group.id}`)
            navigate('/carnet')
        } catch (err) {
            setError(apiErrorMessage(err, 'Impossible de supprimer ce groupe.'))
            setDeleting(false)
        }
    }

    const onHoldCount = group?.members.filter((m) => m.onHold).length ?? 0

    return (
        <div className="min-h-screen bg-app flex flex-col">
            <Navbar />

            <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8">
                <Link to="/carnet" className="text-sm text-slate-500 hover:text-slate-700 transition">
                    ← Mon carnet
                </Link>

                {loading ? (
                    <div className="text-sm text-slate-500 mt-6">Chargement…</div>
                ) : !group ? (
                    <ErrorMessage onRetry={loadError ? reload : undefined} className="mt-6">
                        {loadError || 'Groupe introuvable.'}
                    </ErrorMessage>
                ) : (
                    <>
                        <div className="mt-4 flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                                <span className="w-10 h-10 rounded-xl bg-brand-gradient-diagonal flex items-center justify-center shrink-0">
                                    <span className="text-white text-lg">👥</span>
                                </span>
                                <div className="min-w-0">
                                    {renaming ? (
                                        <form onSubmit={rename} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Escape') {
                                                        setName(group.name)
                                                        setRenaming(false)
                                                    }
                                                }}
                                                maxLength={100}
                                                required
                                                autoFocus
                                                className="h-9 w-64 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                                            />
                                            <button
                                                type="submit"
                                                className="h-9 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-ink text-xs font-medium transition"
                                            >
                                                Enregistrer
                                            </button>
                                        </form>
                                    ) : (
                                        <h1 className="text-xl font-semibold text-slate-800 truncate">
                                            {group.name}
                                        </h1>
                                    )}
                                    <p className="text-sm text-slate-500">
                                        {group.owned ? 'Tu gères ce groupe' : `Géré par ${group.owner.username}`}
                                        {' · '}
                                        {group.members.length} personne
                                        {group.members.length > 1 ? 's' : ''}
                                        {onHoldCount > 0 && <> · {onHoldCount} en retrait</>}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {group.owned ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setName(group.name)
                                                setRenaming((v) => !v)
                                            }}
                                            className="h-8 px-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-medium transition"
                                        >
                                            {renaming ? 'Annuler' : 'Renommer'}
                                        </button>
                                        <button
                                            onClick={() => setDeleting(true)}
                                            className="h-8 px-3 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition"
                                        >
                                            Supprimer
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setLeaving(true)}
                                        className="h-8 px-3 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-red-400 hover:text-red-600 transition"
                                    >
                                        Quitter le groupe
                                    </button>
                                )}
                            </div>
                        </div>

                        <p className="text-xs text-slate-400 mt-3">
                            Un groupe n'ouvre aucun projet par lui-même : il réunit des personnes pour
                            les ajouter ensemble à un projet. Créé le{' '}
                            {format(new Date(group.createdAt), 'd MMMM yyyy', { locale: fr })}.
                        </p>

                        {error && (
                            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-4">
                                {error}
                            </p>
                        )}

                        <section className="bg-surface border border-border rounded-xl p-5 mt-6">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h2 className="text-sm font-semibold text-slate-800">
                                    Membres{' '}
                                    <span className="text-slate-400 font-normal">
                                        {group.members.length}
                                    </span>
                                </h2>
                                {group.owned && (
                                    <button
                                        onClick={() => {
                                            setAdding((v) => !v)
                                            setEmail('')
                                        }}
                                        className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition ${
                                            adding
                                                ? 'bg-surface-muted text-slate-500 rotate-45'
                                                : 'bg-brand-500 text-ink hover:bg-brand-600'
                                        }`}
                                        title={adding ? 'Annuler' : 'Ajouter une personne'}
                                        aria-label={adding ? 'Annuler' : 'Ajouter une personne'}
                                        aria-expanded={adding}
                                    >
                                        <svg
                                            viewBox="0 0 16 16"
                                            className="w-3.5 h-3.5"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M8 3.5v9M3.5 8h9" />
                                        </svg>
                                    </button>
                                )}
                            </div>

                            {adding && (
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault()
                                        if (email.trim()) addMember(email.trim())
                                    }}
                                    className="mb-4"
                                >
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                        Qui veux-tu ajouter ?
                                    </label>
                                    <div className="flex gap-2">
                                        {/* Le carnet derrière le champ : taper deux
                                            lettres d'un nom suffit, et une adresse
                                            passe toujours. */}
                                        <CarnetCombobox
                                            className="flex-1 min-w-0"
                                            value={email}
                                            onChange={setEmail}
                                            onPick={(person) => person.email && addMember(person.email)}
                                            onEscape={() => setAdding(false)}
                                            autoFocus
                                            placeholder="Un nom du carnet, ou prenom@exemple.com"
                                            excludeIds={group.members.map((m) => m.id)}
                                        />
                                        <button
                                            type="submit"
                                            disabled={busy || !email.trim()}
                                            className="h-9 px-3 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-xs font-medium transition disabled:opacity-60 shrink-0"
                                        >
                                            {busy ? 'Ajout…' : 'Ajouter'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1.5">
                                        La personne est prévenue qu'elle fait partie du groupe.
                                    </p>
                                </form>
                            )}

                            <ul className="flex flex-col divide-y divide-border">
                                {group.members.map((member) => {
                                    const isManager = member.id === group.owner.id
                                    return (
                                        <li key={member.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                                            {/* En retrait : la ligne reste lisible mais
                                                s'efface, comme une tâche terminée. */}
                                            <div
                                                className={`flex items-center gap-3 min-w-0 flex-1 ${
                                                    member.onHold ? 'opacity-50' : ''
                                                }`}
                                            >
                                                <UserAvatar user={member} />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm text-slate-700 truncate flex items-center gap-1.5">
                                                        <span className="truncate">{member.username}</span>
                                                        {member.id === currentUserId && (
                                                            <span className="text-slate-400"> · toi</span>
                                                        )}
                                                        {member.suspended && <SuspendedPill />}
                                                    </p>
                                                    {member.email && (
                                                        <p className="text-xs text-slate-400 truncate">
                                                            {member.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {isManager ? (
                                                <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full shrink-0">
                                                    Gérant
                                                </span>
                                            ) : (
                                                member.onHold && (
                                                    <span
                                                        className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0"
                                                        title="Reste dans le groupe, mais ne sera pas ajouté aux projets avec lui. Son compte n'est pas touché."
                                                    >
                                                        En retrait
                                                    </span>
                                                )
                                            )}

                                            {group.owned && !isManager && (
                                                <>
                                                    <button
                                                        onClick={() => setHold(member, !member.onHold)}
                                                        className="h-7 px-2.5 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-brand-500 transition shrink-0"
                                                        title={
                                                            member.onHold
                                                                ? `${member.username} sera de nouveau ajouté aux projets avec le groupe`
                                                                : `${member.username} reste dans le groupe mais ne sera plus ajouté aux projets avec lui`
                                                        }
                                                    >
                                                        {member.onHold ? 'Réintégrer' : 'Mettre en retrait'}
                                                    </button>
                                                    <button
                                                        onClick={() => setRemoving(member)}
                                                        className="text-slate-300 hover:text-red-500 transition text-xs leading-none shrink-0"
                                                        title={`Retirer ${member.username} du groupe`}
                                                        aria-label={`Retirer ${member.username} du groupe`}
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            )}
                                        </li>
                                    )
                                })}
                            </ul>
                        </section>
                    </>
                )}
            </main>

            {removing && (
                <ConfirmDialog
                    title={`Retirer ${removing.username} du groupe ?`}
                    icon="👤"
                    tone="danger"
                    body={
                        <>
                            <strong>{removing.username}</strong> sera prévenu. Ses projets et ses tâches
                            ne changent pas, et tu peux l'ajouter de nouveau à tout moment. Pour une
                            absence passagère, mets-le plutôt en retrait.
                        </>
                    }
                    confirmLabel="Retirer"
                    onCancel={() => setRemoving(null)}
                    onConfirm={() => removeMember(removing)}
                />
            )}

            {deleting && group && (
                <ConfirmDialog
                    title={`Supprimer le groupe « ${group.name} » ?`}
                    icon="🗑️"
                    tone="danger"
                    body={
                        <>
                            Les {group.members.length} personne{group.members.length > 1 ? 's' : ''} qui
                            en font partie sont prévenues, mais rien ne leur arrive : leurs comptes,
                            leurs projets et ton carnet restent intacts. Seule la liste disparaît.
                        </>
                    }
                    confirmLabel="Supprimer le groupe"
                    onCancel={() => setDeleting(false)}
                    onConfirm={removeGroup}
                />
            )}

            {leaving && group && (
                <ConfirmDialog
                    title={`Quitter « ${group.name} » ?`}
                    icon="🚪"
                    tone="danger"
                    body={
                        <>
                            {group.owner.username} sera prévenu de ton départ. Tu ne seras plus ajouté
                            aux projets avec ce groupe, et seul {group.owner.username} peut t'y remettre.
                        </>
                    }
                    confirmLabel="Quitter le groupe"
                    onCancel={() => setLeaving(false)}
                    onConfirm={leave}
                />
            )}
        </div>
    )
}
