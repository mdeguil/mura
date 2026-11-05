import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Navbar from '../components/Navbar'
import AddToggleButton from '../components/AddToggleButton'
import CarnetAddForm from '../components/CarnetAddForm'
import ConfirmDialog from '../components/ConfirmDialog'
import ErrorMessage from '../components/ErrorMessage'
import GroupHeader from '../components/GroupHeader'
import GroupMemberRow from '../components/GroupMemberRow'
import { useApiQuery } from '../hooks/useApiQuery'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import { apiErrorMessage } from '../utils/apiError'
import type { Group, GroupMember } from '../types'

/**
 * A group's page, at /groupe/:id. A group gets a page of its own, like a
 * project: the gérant manages it from here rather than from a row in a
 * list, and a member can at least see who else is in it.
 */
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
    const [error, setError] = useState('')

    const [adding, setAdding] = useState(false)
    const [busy, setBusy] = useState(false)
    const [removing, setRemoving] = useState<GroupMember | null>(null)
    const [deleting, setDeleting] = useState(false)
    const [leaving, setLeaving] = useState(false)

    async function attempt(action: () => Promise<void>, fallback: string): Promise<boolean> {
        setError('')
        try {
            await action()
            return true
        } catch (err) {
            setError(apiErrorMessage(err, fallback))
            return false
        }
    }

    function rename(name: string) {
        return attempt(async () => {
            const { data } = await api.put<Group>(`/groups/${id}`, { name })
            setGroup(data)
        }, 'Impossible de renommer ce groupe.')
    }

    async function addMember(address: string) {
        setBusy(true)
        const added = await attempt(async () => {
            const { data } = await api.post<Group>(`/groups/${id}/members`, { email: address })
            setGroup(data)
        }, "Impossible d'ajouter cette personne.")
        setBusy(false)
        if (added) setAdding(false)
    }

    function setHold(member: GroupMember, onHold: boolean) {
        void attempt(
            async () => {
                const { data } = await api.put<Group>(`/groups/${id}/members/${member.id}/hold`, { onHold })
                setGroup(data)
            },
            onHold ? 'Impossible de mettre cette personne en retrait.' : 'Impossible de la réintégrer.'
        )
    }

    async function removeMember(member: GroupMember) {
        await attempt(async () => {
            await api.delete(`/groups/${id}/members/${member.id}`)
            setGroup((current) => current && { ...current, members: current.members.filter((m) => m.id !== member.id) })
        }, 'Impossible de retirer cette personne.')
        setRemoving(null)
    }

    async function leave() {
        const left = await attempt(async () => {
            await api.delete(`/groups/${id}/members/${currentUserId}`)
        }, 'Impossible de quitter ce groupe.')
        if (left) navigate('/carnet')
        else setLeaving(false)
    }

    async function removeGroup() {
        const removed = await attempt(async () => {
            await api.delete(`/groups/${id}`)
        }, 'Impossible de supprimer ce groupe.')
        if (removed) navigate('/carnet')
        else setDeleting(false)
    }

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
                        <GroupHeader
                            group={group}
                            onRename={rename}
                            onDelete={() => setDeleting(true)}
                            onLeave={() => setLeaving(true)}
                        />

                        <p className="text-xs text-slate-400 mt-3">
                            Un groupe n'ouvre aucun projet par lui-même : il réunit des personnes pour
                            les ajouter ensemble à un projet. Créé le{' '}
                            {format(new Date(group.createdAt), 'd MMMM yyyy', { locale: fr })}.
                        </p>

                        {error && <ErrorMessage className="mt-4">{error}</ErrorMessage>}

                        <section className="bg-surface border border-border rounded-xl p-5 mt-6">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h2 className="text-sm font-semibold text-slate-800">
                                    Membres <span className="text-slate-400 font-normal">{group.members.length}</span>
                                </h2>
                                {group.owned && (
                                    <AddToggleButton
                                        open={adding}
                                        label="Ajouter une personne"
                                        onClick={() => setAdding((v) => !v)}
                                    />
                                )}
                            </div>

                            {adding && (
                                <CarnetAddForm
                                    label="Qui veux-tu ajouter ?"
                                    submitLabel="Ajouter"
                                    busyLabel="Ajout…"
                                    busy={busy}
                                    excludeIds={group.members.map((m) => m.id)}
                                    onSubmit={addMember}
                                    onEscape={() => setAdding(false)}
                                    hint="La personne est prévenue qu'elle fait partie du groupe."
                                />
                            )}

                            <ul className="flex flex-col divide-y divide-border">
                                {group.members.map((member) => (
                                    <GroupMemberRow
                                        key={member.id}
                                        member={member}
                                        isManager={member.id === group.owner.id}
                                        isMe={member.id === currentUserId}
                                        canManage={group.owned}
                                        onToggleHold={() => setHold(member, !member.onHold)}
                                        onRemove={() => setRemoving(member)}
                                    />
                                ))}
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
