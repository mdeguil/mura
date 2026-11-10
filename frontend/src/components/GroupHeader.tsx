import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import type { Group } from '../types'

/**
 * The group's name, renamed in place by its gérant, and what can be done
 * to the group as a whole: the gérant renames or deletes it, anyone else
 * can only leave.
 *
 * @param props the group and its three actions
 */
export default function GroupHeader({
    group,
    onRename,
    onDelete,
    onLeave,
}: {
    /** The group. */
    group: Group
    /** Saves a new name; answers whether it was kept, so the field knows to close. */
    onRename: (name: string) => Promise<boolean>
    /** Asks to delete the group. */
    onDelete: () => void
    /** Asks to leave the group. */
    onLeave: () => void
}) {
    const { t } = useTranslation()
    const [renaming, setRenaming] = useState(false)
    const [name, setName] = useState('')
    const onHoldCount = group.members.filter((m) => m.onHold).length

    async function rename(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim() || name.trim() === group.name || (await onRename(name.trim()))) {
            setRenaming(false)
        }
    }

    return (
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
                                    if (e.key === 'Escape') setRenaming(false)
                                }}
                                maxLength={100}
                                required
                                autoFocus
                                aria-label={t('groups.header.name')}
                                className="h-9 w-64 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 outline-none focus:border-brand-500 transition"
                            />
                            <button
                                type="submit"
                                className="h-9 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-ink text-xs font-medium transition"
                            >
                                {t('common.save')}
                            </button>
                        </form>
                    ) : (
                        <h1 className="text-xl font-semibold text-slate-800 truncate">{group.name}</h1>
                    )}
                    <p className="text-sm text-slate-500">
                        {group.owned ? t('groups.youManageIt') : t('groups.managedByName', { name: group.owner.username })}
                        {' · '}
                        {t('groups.people', { count: group.members.length })}
                        {onHoldCount > 0 && <> · {t('groups.onHoldCount', { count: onHoldCount })}</>}
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
                            {renaming ? t('common.cancel') : t('groups.header.rename')}
                        </button>
                        <button
                            onClick={onDelete}
                            className="h-8 px-3 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition"
                        >
                            {t('common.delete')}
                        </button>
                    </>
                ) : (
                    <button
                        onClick={onLeave}
                        className="h-8 px-3 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-red-400 hover:text-red-600 transition"
                    >
                        {t('groups.header.leave')}
                    </button>
                )}
            </div>
        </div>
    )
}
