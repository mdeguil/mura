import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import ErrorMessage from './ErrorMessage'
import UserAvatar from './UserAvatar'
import { useApiQuery } from '../hooks/useApiQuery'
import type { Group } from '../types'

/**
 * The reader's groups, in the carnet. The list, and nothing else: a card
 * opens the group's own page, the way a project card opens the project.
 * Managing a list of people from inside a row was never going to fit once
 * the row had to hold a hold button too.
 *
 * No way to create one from here: groups are set up by an administrator,
 * who names the gérant, from the Administration page.
 */
export default function GroupList() {
    const { t } = useTranslation()
    const { data: groups, loading, error, reload } = useApiQuery<Group[]>(
        '/groups',
        [],
        t('groups.loadGroups')
    )

    if (loading) return <div className="text-sm text-slate-500">{t('common.loading')}</div>

    return (
        <div>
            <p className="text-sm text-slate-500 mb-4">
                {t('groups.list.intro')}
            </p>

            {error ? (
                <ErrorMessage onRetry={reload}>{error}</ErrorMessage>
            ) : groups.length === 0 ? (
                <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-brand-gradient-diagonal flex items-center justify-center mb-4">
                        <span className="text-white text-2xl">👥</span>
                    </div>
                    <h2 className="text-base font-semibold text-slate-800 mb-1">{t('groups.list.empty')}</h2>
                    <p className="text-sm text-slate-500 max-w-sm">
                        {t('groups.list.emptyHint')}
                    </p>
                </div>
            ) : (
                <ul className="flex flex-col gap-3">
                    {groups.map((group) => {
                        const onHold = group.members.filter((m) => m.onHold).length
                        return (
                            <li key={group.id}>
                                <Link
                                    to={`/groupe/${group.id}`}
                                    className="block bg-surface border border-border rounded-xl p-4 hover:border-emerald-400 transition"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-slate-800 truncate">
                                                {group.name}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {t('groups.people', { count: group.members.length })}
                                                {onHold > 0 && <> · {t('groups.onHoldCount', { count: onHold })}</>}
                                                {' · '}
                                                {group.owned
                                                    ? t('groups.youManage')
                                                    : t('groups.managedBy', { name: group.owner.username })}
                                            </p>
                                        </div>
                                        <span className="text-xs text-slate-400 shrink-0">{t('groups.list.open')}</span>
                                    </div>

                                    <ul className="flex flex-wrap gap-2 mt-3">
                                        {group.members.map((member) => (
                                            <li
                                                key={member.id}
                                                className={`flex items-center gap-2 bg-surface-muted border border-border rounded-full pl-1 pr-2.5 py-1 ${
                                                    member.onHold ? 'opacity-50' : ''
                                                }`}
                                            >
                                                <UserAvatar user={member} size="sm" />
                                                <span className="text-xs text-slate-600">
                                                    {member.username}
                                                    {member.id === group.owner.id && (
                                                        <span className="text-slate-400"> · {t('groups.manager')}</span>
                                                    )}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
