import { useTranslation } from 'react-i18next'
import PersonIdentity from './PersonIdentity'
import type { Member, ProjectRole } from '../types'

/**
 * One person on the team. The owner changes roles from here; the owner and
 * the admins can take someone out. Nobody removes themself from their own
 * row: leaving has a button of its own.
 *
 * @param props the member, what the reader may do and what to do on each action
 */
export default function ProjectMemberRow({
    member,
    isMe,
    isOwner,
    canManage,
    onRoleChange,
    onRemove,
}: {
    /** The member shown. */
    member: Member
    /** Whether the row is the reader's own. */
    isMe: boolean
    /** Whether the reader owns the project, not whether this member does. */
    isOwner: boolean
    /** Whether the reader may take members out. */
    canManage: boolean
    /** Called with the role picked for this member. */
    onRoleChange: (role: ProjectRole) => void
    /** Called to take this member out. */
    onRemove: () => void
}) {
    const { t } = useTranslation()
    return (
        <li className="flex items-center gap-3 py-2.5 first:pt-0">
            <PersonIdentity person={member} isMe={isMe} />

            {member.role === 'OWNER' ? (
                <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full shrink-0">
                    {t('projects.role.OWNER')}
                </span>
            ) : isOwner ? (
                <select
                    value={member.role}
                    onChange={(e) => onRoleChange(e.target.value as ProjectRole)}
                    className="h-7 rounded-lg border border-border-strong bg-surface-muted px-1.5 text-xs text-slate-600 outline-none focus:border-brand-500 transition shrink-0"
                    aria-label={t('projects.member.roleOf', { name: member.username })}
                >
                    <option value="MEMBER">{t('projects.role.MEMBER')}</option>
                    <option value="ADMIN">{t('projects.role.ADMIN')}</option>
                </select>
            ) : (
                <span className="text-xs text-slate-400 shrink-0">{t(`projects.role.${member.role}`)}</span>
            )}

            {member.role !== 'OWNER' && canManage && !isMe && (
                <button
                    onClick={onRemove}
                    className="text-slate-300 hover:text-red-500 transition text-xs leading-none shrink-0"
                    title={t('projects.member.remove', { name: member.username })}
                    aria-label={t('projects.member.remove', { name: member.username })}
                >
                    ✕
                </button>
            )}
        </li>
    )
}
