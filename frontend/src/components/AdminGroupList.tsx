import React, { useEffect, useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import ConfirmDialog from './ConfirmDialog'
import UserAvatar from './UserAvatar'
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
                    Monte un groupe et désigne qui le gère. Les membres sont ensuite l'affaire du
                    gérant, depuis son carnet.
                </p>
                <button
                    onClick={creating ? close : openCreate}
                    className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition shrink-0"
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
                            className="h-9 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition disabled:opacity-40"
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
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-brand-500 to-emerald-400 flex items-center justify-center mb-4">
                        <span className="text-white text-2xl">👥</span>
                    </div>
                    <h2 className="text-base font-semibold text-slate-800 mb-1">Aucun groupe</h2>
                    <p className="text-sm text-slate-500 max-w-sm">
                        Les groupes créés ici apparaissent dans le carnet de leur gérant.
                    </p>
                </div>
            ) : (
                <ul className="bg-surface border border-border rounded-2xl overflow-hidden">
                    {groups.map((group) => (
                        <li
                            key={group.id}
                            className="px-5 py-4 border-b border-border last:border-b-0 flex items-center gap-4"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-800 truncate">{group.name}</p>
                                <p className="text-xs text-slate-400">
                                    {group.memberCount} membre{group.memberCount > 1 ? 's' : ''}
                                </p>
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
                        </li>
                    ))}
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
