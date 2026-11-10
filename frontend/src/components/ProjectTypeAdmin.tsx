import { Trans, useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import ConfirmDialog from './ConfirmDialog'
import ErrorMessage from './ErrorMessage'
import { useApiQuery } from '../hooks/useApiQuery'
import type { ProjectType } from '../types'

const SUGGESTED = ['🌐', '📱', '📣', '🎉', '📁', '🔬', '🧪', '🎨', '📊', '🛠️', '🚀', '📚', '💡', '🏗️']

/**
 * The Types tab of the administration: every project type with how many
 * projects it holds, and creating, editing and deleting them. The fallback
 * type can be neither edited nor deleted.
 */
export default function ProjectTypeAdmin() {
    const { t } = useTranslation()
    const {
        data: types,
        setData: setTypes,
        loading,
        error: loadError,
        reload,
    } = useApiQuery<ProjectType[]>('/admin/project-types', [], t('admin.types.loadFailed'))
    const [error, setError] = useState('')

    const [editing, setEditing] = useState<ProjectType | null>(null)
    const [creating, setCreating] = useState(false)
    const [label, setLabel] = useState('')
    const [emoji, setEmoji] = useState('📁')
    const [saving, setSaving] = useState(false)
    const [removing, setRemoving] = useState<ProjectType | null>(null)


    function openCreate() {
        setEditing(null)
        setCreating(true)
        setLabel('')
        setEmoji('📁')
        setError('')
    }

    function openEdit(type: ProjectType) {
        setCreating(false)
        setEditing(type)
        setLabel(type.label)
        setEmoji(type.emoji)
        setError('')
    }

    function close() {
        setCreating(false)
        setEditing(null)
        setError('')
    }

    async function save(e: React.FormEvent) {
        e.preventDefault()
        if (!label.trim() || !emoji.trim()) return

        setError('')
        setSaving(true)
        try {
            const body = { label: label.trim(), emoji: emoji.trim() }
            if (editing) {
                const { data } = await api.put<ProjectType>(`/admin/project-types/${editing.id}`, body)
                setTypes((prev) => prev.map((t) => (t.id === data.id ? data : t)))
            } else {
                const { data } = await api.post<ProjectType>('/admin/project-types', body)
                setTypes((prev) => [...prev, data])
            }
            close()
        } catch (err) {
            setError(apiErrorMessage(err, t('admin.types.saveFailed')))
        } finally {
            setSaving(false)
        }
    }

    async function remove(type: ProjectType) {
        setError('')
        try {
            await api.delete(`/admin/project-types/${type.id}`)
            setTypes((prev) =>
                prev
                    .filter((t) => t.id !== type.id)
                    .map((t) =>
                        t.fallback
                            ? { ...t, projectCount: (t.projectCount ?? 0) + (type.projectCount ?? 0) }
                            : t
                    )
            )
            setRemoving(null)
        } catch (err) {
            setError(apiErrorMessage(err, t('admin.types.deleteFailed')))
            setRemoving(null)
        }
    }

    if (loading) return <p className="text-sm text-slate-500">{t('common.loading')}</p>

    return (
        <div>
            <div className="flex items-center justify-between gap-4 mb-4">
                <p className="text-sm text-slate-500">
                    {t('admin.types.intro')}
                </p>
                <button
                    onClick={creating ? close : openCreate}
                    className="h-9 px-4 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition shrink-0"
                >
                    {creating ? t('common.cancel') : t('admin.types.new')}
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
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('admin.types.emoji')}</label>
                            <input
                                type="text"
                                value={emoji}
                                onChange={(e) => setEmoji(e.target.value)}
                                maxLength={16}
                                required
                                className="w-16 h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-center text-lg outline-none focus:border-brand-500 transition"
                            />
                        </div>
                        <div className="flex-1 min-w-[12rem]">
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">{t('admin.types.name')}</label>
                            <input
                                type="text"
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder={t('admin.types.namePlaceholder')}
                                maxLength={50}
                                required
                                autoFocus
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={saving || !label.trim()}
                            className="h-9 px-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-ink text-xs font-medium transition disabled:opacity-40"
                        >
                            {saving ? t('common.saving') : editing ? t('common.save') : t('admin.types.create')}
                        </button>
                        <button
                            type="button"
                            onClick={close}
                            className="h-9 px-3 rounded-lg text-xs font-medium text-slate-500 hover:bg-surface-muted transition"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {SUGGESTED.map((e) => (
                            <button
                                key={e}
                                type="button"
                                onClick={() => setEmoji(e)}
                                className={`w-8 h-8 rounded-lg text-base transition ${
                                    emoji === e ? 'bg-brand-100' : 'hover:bg-surface-muted'
                                }`}
                                aria-label={t('admin.types.use', { emoji: e })}
                            >
                                {e}
                            </button>
                        ))}
                    </div>
                </form>
            )}

            <ul className="bg-surface border border-border rounded-2xl overflow-hidden">
                {types.map((type) => (
                    <li
                        key={type.id}
                        className="px-5 py-3 border-b border-border last:border-b-0 flex items-center gap-4"
                    >
                        <span className="text-xl w-8 text-center shrink-0" aria-hidden="true">
                            {type.emoji}
                        </span>
                        <span className="text-sm font-medium text-slate-800 flex-1 min-w-0 truncate">
                            {type.label}
                        </span>

                        {type.fallback && (
                            <span className="shrink-0 text-[10px] font-medium rounded-full px-2 py-0.5 border border-border-strong bg-surface-muted text-slate-500">
                                {t('admin.types.fallback')}
                            </span>
                        )}

                        <span className="shrink-0 w-24 text-right text-xs text-slate-400">
                            {t('admin.types.projects', { count: type.projectCount ?? 0 })}
                        </span>

                        <div className="flex items-center gap-2 shrink-0 w-[168px] justify-end">
                            {type.fallback ? (
                                <span className="text-xs text-slate-400">{t('admin.types.locked')}</span>
                            ) : (
                                <>
                                    <button
                                        onClick={() => openEdit(type)}
                                        className="h-8 px-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-medium transition"
                                    >
                                        {t('admin.types.edit')}
                                    </button>
                                    <button
                                        onClick={() => setRemoving(type)}
                                        className="h-8 px-3 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition"
                                    >
                                        {t('common.delete')}
                                    </button>
                                </>
                            )}
                        </div>
                    </li>
                ))}
            </ul>

            {removing && (
                <ConfirmDialog
                    title={t('admin.types.deleteTitle', { name: removing.label })}
                    icon="🗑️"
                    body={
                        (removing.projectCount ?? 0) > 0 ? (
                            <Trans
                                i18nKey="admin.types.deleteBody"
                                count={removing.projectCount ?? 0}
                                values={{ fallback: types.find((type) => type.fallback)?.label ?? '' }}
                                components={{ strong: <strong /> }}
                            />
                        ) : (
                            t('admin.types.deleteUnused')
                        )
                    }
                    confirmLabel={t('common.delete')}
                    onCancel={() => setRemoving(null)}
                    onConfirm={() => remove(removing)}
                />
            )}
        </div>
    )
}
