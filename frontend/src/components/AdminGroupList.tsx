import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import ConfirmDialog from './ConfirmDialog'
import UserAvatar, { SuspendedPill } from './UserAvatar'
import type { Account, AdminGroup } from '../types'

export default function AdminGroupList() {
    const [groups, setGroups] = useState<AdminGroup[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [editing, setEditing] = useState<AdminGroup | null>(null)
    const [creating, setCreating] = useState(false)
    const [name, setName] = useState('')
    const [managerId, setManagerId] = useState('')
    const [saving, setSaving] = useState(false)
    const [removing, setRemoving] = useState<AdminGroup | null>(null)
    // Groups whose members are unfolded. Several can be open at once, to
    // compare two lists side by side.
    const [expanded, setExpanded] = useState<Set<string>>(new Set())

    function toggleMembers(groupId: string) {
        setExpanded((prev) => {
            const next = new Set(prev)
            if (next.has(groupId)) next.delete(groupId)
            else next.add(groupId)
            return next
        })
    }

    useEffect(() => {
        let cancelled = false

        Promise.all([
            api.get<AdminGroup[]>('/admin/groups'),
            // The gérant is picked from the accounts, so both lists are
            // needed before the form can be opened.
            api.get<Account[]>('/admin/accounts'),
        ])
            .then(([g, a]) => {
                if (cancelled) return
                setGroups(g.data)
                setAccounts(a.data)
            })
            .catch((err) => {
                if (!cancelled) setError(apiErrorMessage(err, 'Impossible de charger les groupes.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [])

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
            setError(apiErrorMessage(err, "Ce groupe n'a pas pu être enregistré."))
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
            setError(apiErrorMessage(err, "Ce groupe n'a pas pu être supprimé."))
            setRemoving(null)
        }
    }

    if (loading) return <p className="text-sm text-slate-500">Chargement…</p>

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-4">
                <p className="text-sm text-slate-500">
                    Monte un groupe et désigne qui le gère. Tu vois qui en fait partie, mais les
                    membres restent l'affaire du gérant, depuis la page du groupe.
                </p>
                <button
                    onClick={creating ? close : openCreate}
                    className="h-9 px-4 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition shrink-0"
                >
                    {creating ? 'Annuler' : '+ Nouveau groupe'}
                </button>
            </div>

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
                                Nom du groupe
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex : Pôle design"
                                maxLength={100}
                                required
                                autoFocus
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                            />
                        </div>
                        <div className="min-w-[12rem]">
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                Gérant
                            </label>
                            <select
                                value={managerId}
                                onChange={(e) => setManagerId(e.target.value)}
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-2.5 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                            >
                                {/* Suspended accounts are left out: somebody who
                                    cannot sign in cannot manage anything. */}
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
                            {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer'}
                        </button>
                        <button
                            type="button"
                            onClick={close}
                            className="h-9 px-3 rounded-lg text-xs font-medium text-slate-500 hover:bg-surface-muted transition"
                        >
                            Annuler
                        </button>
                    </div>

                    {editing && editing.manager.id !== managerId && (
                        <p className="text-xs text-slate-500 mt-3">
                            {accounts.find((a) => a.id === managerId)?.username} prendra la main sur ce
                            groupe. {editing.manager.username} en reste membre.
                        </p>
                    )}
                </form>
            )}

            {groups.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-brand-gradient-diagonal flex items-center justify-center mb-4">
                        <span className="text-white text-2xl">👥</span>
                    </div>
                    <h2 className="text-base font-semibold text-slate-800 mb-1">Aucun groupe</h2>
                    <p className="text-sm text-slate-500 max-w-sm">
                        Les groupes créés ici apparaissent dans le carnet de leur gérant.
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
                                            {group.memberCount} membre{group.memberCount > 1 ? 's' : ''}
                                            {onHoldCount > 0 && <> · {onHoldCount} en retrait</>}
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 w-44">
                                        <UserAvatar user={group.manager} size="sm" />
                                        <span className="min-w-0">
                                            <span className="block text-xs text-slate-700 truncate">
                                                {group.manager.username}
                                            </span>
                                            <span className="block text-[10px] text-slate-400">gérant</span>
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={() => openEdit(group)}
                                            className="h-8 px-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-medium transition"
                                        >
                                            Modifier
                                        </button>
                                        <button
                                            onClick={() => setRemoving(group)}
                                            className="h-8 px-3 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </div>

                                {/* Read only on purpose: nothing here adds, removes or
                                    sets anyone aside. That is the gérant's list. */}
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
                                                        Gérant
                                                    </span>
                                                ) : (
                                                    member.onHold && (
                                                        <span
                                                            className="text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0"
                                                            title="Mis de côté par le gérant dans ce groupe. Son compte n'est pas touché."
                                                        >
                                                            En retrait
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
                    title={`Supprimer « ${removing.name} » ?`}
                    icon="🗑️"
                    body={
                        <>
                            Le groupe disparaît pour ses {removing.memberCount} membre
                            {removing.memberCount > 1 ? 's' : ''}, {removing.manager.username} compris.
                            Personne ne perd son compte ni ses projets : un groupe ne donne aucun accès.
                        </>
                    }
                    confirmLabel="Supprimer"
                    onCancel={() => setRemoving(null)}
                    onConfirm={() => remove(removing)}
                />
            )}
        </div>
    )
}
