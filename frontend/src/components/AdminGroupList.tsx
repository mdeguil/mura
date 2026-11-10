import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import ConfirmDialog from './ConfirmDialog'
import ErrorMessage from './ErrorMessage'
import { useApiQuery } from '../hooks/useApiQuery'
import UserAvatar, { SuspendedPill } from './UserAvatar'
import type { Account, AdminGroup } from '../types'

/**
 * The Groupes tab of the administration: every group with its gérant and
 * members, and creating, renaming, handing over and deleting groups. The
 * members are shown, not edited: that stays the gérant's business.
 */
export default function AdminGroupList() {
    const { t } = useTranslation()
    const groupsQuery = useApiQuery<AdminGroup[]>('/admin/groups', [], t('admin.groups.loadFailed'))
    const accountsQuery = useApiQuery<Account[]>('/admin/accounts', [], t('admin.accounts.loadFailed'))
    const { data: groups, setData: setGroups } = groupsQuery
    const accounts = accountsQuery.data
    const loading = groupsQuery.loading || accountsQuery.loading
    const loadError = groupsQuery.error || accountsQuery.error
    function reload() {
        groupsQuery.reload()
        accountsQuery.reload()
    }

    const [error, setError] = useState('')

    const [editing, setEditing] = useState<AdminGroup | null>(null)
    const [creating, setCreating] = useState(false)
    const [name, setName] = useState('')
    const [managerId, setManagerId] = useState('')
    const [saving, setSaving] = useState(false)
    const [removing, setRemoving] = useState<AdminGroup | null>(null)
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    function toggleMembers(groupId: string) {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(groupId)) next.delete(groupId)
            else next.add(groupId)
            return next
        })
    }


    const reachable = accounts.filter((a) => !a.suspended)

    function openCreate() {
        setEditing(null)
        setCreating(true)
        setName('')
        setManagerId(reachable[0]?.id ?? '')
        setError('')
    }

    function openEdit(group: AdminGroup) {
        setCreating(false)
        setEditing(group)
        setName(group.name)
        setManagerId(group.manager.id)
        setError('')
    }

    function close() {
        setCreating(false)
        setEditing(null)
        setError('')
    }

    async function save(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim() || !managerId) return

        setError('')
        setSaving(true)
        try {
            const body = { name: name.trim(), managerId }
            if (editing) {
                const { data } = await api.put<AdminGroup>(`/admin/groups/${editing.id}`, body)
                setGroups((prev) => prev.map((g) => (g.id === data.id ? data : g)))
            } else {
                const { data } = await api.post<AdminGroup>('/admin/groups', body)
                setGroups((prev) =>
                    [...prev, data].sort((a, b) =>
                        a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
                    )
                )
            }
            close()
        } catch (err) {
            setError(apiErrorMessage(err, t('admin.groups.saveFailed')))
        } finally {
            setSaving(false)
        }
    }

    async function remove(group: AdminGroup) {
        setError('')
        try {
            await api.delete(`/admin/groups/${group.id}`)
            setGroups((prev) => prev.filter((g) => g.id !== group.id))
            setRemoving(null)
        } catch (err) {
            setError(apiErrorMessage(err, t('admin.groups.deleteFailed')))
            setRemoving(null)
        }
    }

    if (loading) return <p className="text-sm text-slate-500">{t('common.loading')}</p>

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-4">
                <p className="text-sm text-slate-500">
                    {t('admin.groups.intro')}
                </p>
                <button
                    onClick={creating ? close : openCreate}
                    className="h-9 px-4 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition shrink-0"
                >
                    {creating ? t('common.cancel') : t('admin.groups.new')}
                </button>
            </div>

            {loadError && (
                <ErrorMessage onRetry={reload} className="mb-4">
                    {loadError}
                </ErrorMessage>
            )}

            {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
                    {error}
                </p>
            )}

            {(creating || editing) && (
                <form onSubmit={save} className="bg-surface border border-border rounded-xl p-4 mb-5">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[12rem]">
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                {t('admin.groups.name')}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('admin.groups.namePlaceholder')}
                                maxLength={100}
                                required
                                autoFocus
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                            />
                        </div>
                        <div className="min-w-[12rem]">
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                {t('admin.groups.manager')}
                            </label>
                            <select
                                value={managerId}
                                onChange={(e) => setManagerId(e.target.value)}
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                            >
                                {reachable.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.username}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={saving || !name.trim() || !managerId}
                            className="h-9 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-ink text-xs font-medium transition disabled:opacity-40"
                        >
                            {saving ? t('common.saving') : editing ? t('common.save') : t('admin.groups.create')}
                        </button>
                        <button
                            type="button"
                            onClick={close}
                            className="h-9 px-3 rounded-lg text-xs font-medium text-slate-500 hover:bg-surface-muted transition"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>

                    {editing && editing.manager.id !== managerId && (
                        <p className="text-xs text-slate-500 mt-3">
                            {t('admin.groups.handover', {
                                next: accounts.find((a) => a.id === managerId)?.username,
                                previous: editing.manager.username,
                            })}
                        </p>
                    )}
                </form>
            )}

            {groups.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-brand-gradient-diagonal flex items-center justify-center mb-4">
                        <span className="text-white text-2xl">👥</span>
                    </div>
                    <h2 className="text-base font-semibold text-slate-800 mb-1">{t('admin.groups.empty')}</h2>
                    <p className="text-sm text-slate-500 max-w-sm">
                        {t('admin.groups.emptyHint')}
                    </p>
                </div>
            ) : (
                <ul className="bg-surface border border-border rounded-2xl overflow-hidden">
                    {groups.map((group) => {
                        const open = expanded.has(group.id)
                        const onHoldCount = group.members.filter((m) => m.onHold).length
                        return (
                            <li key={group.id} className="border-b border-border last:border-b-0">
                                <div className="px-5 py-4 flex items-center gap-4">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-800 truncate">{group.name}</p>
                                        <button
                                            onClick={() => toggleMembers(group.id)}
                                            aria-expanded={open}
                                            className="text-xs text-slate-400 hover:text-brand-600 transition flex items-center gap-1"
                                        >
                                            <span
                                                className={`inline-block transition-transform ${open ? 'rotate-90' : ''}`}
                                                aria-hidden
                                            >
                                                ›
                                            </span>
                                            {t('admin.groups.members', { count: group.memberCount })}
                                            {onHoldCount > 0 && <> · {t('groups.onHoldCount', { count: onHoldCount })}</>}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 w-44">
                                        <UserAvatar user={group.manager} size="sm" />
                                        <span className="min-w-0">
                                            <span className="block text-xs text-slate-700 truncate">
                                                {group.manager.username}
                                            </span>
                                            <span className="block text-[10px] text-slate-400">{t('admin.groups.managerLabel')}</span>
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => openEdit(group)}
                                            className="h-8 px-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-medium transition"
                                        >
                                            {t('admin.groups.edit')}
                                        </button>
                                        <button
                                            onClick={() => setRemoving(group)}
                                            className="h-8 px-3 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition"
                                        >
                                            {t('common.delete')}
                                        </button>
                                    </div>
                                </div>

                                {open && (
                                    <ul className="mx-5 mb-4 -mt-1 bg-surface-muted border border-border rounded-xl divide-y divide-border">
                                        {group.members.map((member) => (
                                            <li key={member.id} className="px-4 py-2 flex items-center gap-3">
                                                <div
                                                    className={`flex items-center gap-3 min-w-0 flex-1 ${
                                                        member.onHold ? 'opacity-50' : ''
                                                    }`}
                                                >
                                                    <UserAvatar user={member} size="sm" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs text-slate-700 truncate flex items-center gap-1.5">
                                                            <span className="truncate">{member.username}</span>
                                                            {member.suspended && <SuspendedPill />}
                                                        </p>
                                                        {member.email && (
                                                            <p className="text-[11px] text-slate-400 truncate">
                                                                {member.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {member.id === group.manager.id ? (
                                                    <span className="text-[10px] font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full shrink-0">
                                                        {t('groups.managerBadge')}
                                                    </span>
                                                ) : (
                                                    member.onHold && (
                                                        <span
                                                            className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0"
                                                            title={t('admin.groups.onHoldHint')}
                                                        >
                                                            {t('groups.onHold')}
                                                        </span>
                                                    )
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        )
                    })}
                </ul>
            )}

            {removing && (
                <ConfirmDialog
                    title={t('admin.groups.deleteTitle', { name: removing.name })}
                    icon="🗑️"
                    body={
                        t('admin.groups.deleteBody', { count: removing.memberCount, manager: removing.manager.username })
                    }
                    confirmLabel={t('common.delete')}
                    onCancel={() => setRemoving(null)}
                    onConfirm={() => remove(removing)}
                />
            )}
        </div>
    )
}
