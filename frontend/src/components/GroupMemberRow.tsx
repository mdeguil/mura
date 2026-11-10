import { useTranslation } from 'react-i18next'
import PersonIdentity from './PersonIdentity'
import type { GroupMember } from '../types'

/**
 * One person in a group. The gérant's row is marked and cannot be touched;
 * for the others, the gérant can set them aside or take them out.
 *
 * @param props the member, who is looking, and the gérant's two actions
 */
export default function GroupMemberRow({
    member,
    isManager,
    isMe,
    canManage,
    onToggleHold,
    onRemove,
}: {
    /** The member. */
    member: GroupMember
    /** Whether this member is the gérant. */
    isManager: boolean
    /** Whether this member is the reader. */
    isMe: boolean
    /** Whether the reader is the gérant, and so may act on the row. */
    canManage: boolean
    /** Sets the member aside, or brings them back. */
    onToggleHold: () => void
    /** Asks to take the member out of the group. */
    onRemove: () => void
}) {
    const { t } = useTranslation()
    return (
        <li className="flex items-center gap-3 py-2.5 first:pt-0">
            <div className={`flex items-center gap-3 min-w-0 flex-1 ${member.onHold ? 'opacity-50' : ''}`}>
                <PersonIdentity person={member} isMe={isMe} />
            </div>

            {isManager ? (
                <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full shrink-0">
                    {t('groups.managerBadge')}
                </span>
            ) : (
                member.onHold && (
                    <span
                        className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0"
                        title={t('groups.member.onHoldHint')}
                    >
                        {t('groups.onHold')}
                    </span>
                )
            )}

            {canManage && !isManager && (
                <>
                    <button
                        onClick={onToggleHold}
                        className="h-7 px-2.5 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-brand-500 transition shrink-0"
                        title={
                            member.onHold
                                ? t('groups.member.restoreHint', { name: member.username })
                                : t('groups.member.holdHint', { name: member.username })
                        }
                    >
                        {member.onHold ? t('groups.member.restore') : t('groups.member.hold')}
                    </button>
                    <button
                        onClick={onRemove}
                        className="text-slate-300 hover:text-red-500 transition text-xs leading-none shrink-0"
                        title={t('groups.member.remove', { name: member.username })}
                        aria-label={t('groups.member.remove', { name: member.username })}
                    >
                        ✕
                    </button>
                </>
            )}
        </li>
    )
}
