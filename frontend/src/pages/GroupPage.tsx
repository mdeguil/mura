import { Trans, useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { dateLocale } from '../utils/dates'
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
    const { t } = useTranslation()
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const currentUserId = useAuthStore((s) => s.user?.id) ?? ''

    const {
        data: group,
        setData: setGroup,
        loading,
        error: loadError,
        reload,
    } = useApiQuery<Group | null>(`/groups/${id}`, null, t('groups.page.errors.load'))
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
        }, t('groups.page.errors.rename'))
    }

    async function addMember(address: string) {
        setBusy(true)
        const added = await attempt(async () => {
            const { data } = await api.post<Group>(`/groups/${id}/members`, { email: address })
            setGroup(data)
        }, t('groups.page.errors.add'))
        setBusy(false)
        if (added) setAdding(false)
    }

    function setHold(member: GroupMember, onHold: boolean) {
        void attempt(
            async () => {
                const { data } = await api.put<Group>(`/groups/${id}/members/${member.id}/hold`, { onHold })
                setGroup(data)
            },
            onHold ? t('groups.page.errors.hold') : t('groups.page.errors.restore')
        )
    }

    async function removeMember(member: GroupMember) {
        await attempt(async () => {
            await api.delete(`/groups/${id}/members/${member.id}`)
            setGroup((current) => current && { ...current, members: current.members.filter((m) => m.id !== member.id) })
        }, t('groups.page.errors.remove'))
        setRemoving(null)
    }

    async function leave() {
        const left = await attempt(async () => {
            await api.delete(`/groups/${id}/members/${currentUserId}`)
        }, t('groups.page.errors.leave'))
        if (left) navigate('/carnet')
        else setLeaving(false)
    }

    async function removeGroup() {
        const removed = await attempt(async () => {
            await api.delete(`/groups/${id}`)
        }, t('groups.page.errors.delete'))
        if (removed) navigate('/carnet')
        else setDeleting(false)
    }

    return (
        <div className="min-h-screen bg-app flex flex-col">
            <Navbar />

            <main className="flex-1 w-full max-w-3xl mx-auto px-6 py-8">
                <Link to="/carnet" className="text-sm text-slate-500 hover:text-slate-700 transition">
                    {t('groups.page.back')}
                </Link>

                {loading ? (
                    <div className="text-sm text-slate-500 mt-6">{t('common.loading')}</div>
                ) : !group ? (
                    <ErrorMessage onRetry={loadError ? reload : undefined} className="mt-6">
                        {loadError || t('groups.page.notFound')}
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
                            {t('groups.page.intro', {
                                date: format(new Date(group.createdAt), 'd MMMM yyyy', { locale: dateLocale() }),
                            })}
                        </p>

                        {error && <ErrorMessage className="mt-4">{error}</ErrorMessage>}

                        <section className="bg-surface border border-border rounded-xl p-5 mt-6">
                            <div className="flex items-center justify-between gap-3 mb-4">
                                <h2 className="text-sm font-semibold text-slate-800">
                                    {t('groups.page.members')} <span className="text-slate-400 font-normal">{group.members.length}</span>
                                </h2>
                                {group.owned && (
                                    <AddToggleButton
                                        open={adding}
                                        label={t('groups.page.addPerson')}
                                        onClick={() => setAdding((v) => !v)}
                                    />
                                )}
                            </div>

                            {adding && (
                                <CarnetAddForm
                                    label={t('groups.page.who')}
                                    submitLabel={t('groups.page.add')}
                                    busyLabel={t('groups.page.adding')}
                                    busy={busy}
                                    excludeIds={group.members.map((m) => m.id)}
                                    onSubmit={addMember}
                                    onEscape={() => setAdding(false)}
                                    hint={t('groups.page.addHint')}
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
                    title={t('groups.page.removeTitle', { name: removing.username })}
                    icon="👤"
                    tone="danger"
                    body={
                        <Trans
                            i18nKey="groups.page.removeBody"
                            values={{ name: removing.username }}
                            components={{ strong: <strong /> }}
                        />
                    }
                    confirmLabel={t('groups.page.remove')}
                    onCancel={() => setRemoving(null)}
                    onConfirm={() => removeMember(removing)}
                />
            )}

            {deleting && group && (
                <ConfirmDialog
                    title={t('groups.page.deleteTitle', { name: group.name })}
                    icon="🗑️"
                    tone="danger"
                    body={
                        t('groups.page.deleteBody', { count: group.members.length })
                    }
                    confirmLabel={t('groups.page.delete')}
                    onCancel={() => setDeleting(false)}
                    onConfirm={removeGroup}
                />
            )}

            {leaving && group && (
                <ConfirmDialog
                    title={t('groups.page.leaveTitle', { name: group.name })}
                    icon="🚪"
                    tone="danger"
                    body={
                        t('groups.page.leaveBody', { owner: group.owner.username })
                    }
                    confirmLabel={t('groups.page.leave')}
                    onCancel={() => setLeaving(false)}
                    onConfirm={leave}
                />
            )}
        </div>
    )
}
