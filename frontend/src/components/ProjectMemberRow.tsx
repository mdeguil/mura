import PersonIdentity from './PersonIdentity'
import type { Member, ProjectRole } from '../types'

const ROLE_LABELS: Record<ProjectRole, string> = {
    OWNER: 'Propriétaire',
    ADMIN: 'Administrateur',
    MEMBER: 'Membre',
}

// One person on the team. The owner changes roles from here; the owner and
// the admins can take someone out. Nobody removes themself from their own
// row: leaving has a button of its own.
export default function ProjectMemberRow({
    member,
    isMe,
    isOwner,
    canManage,
    onRoleChange,
    onRemove,
}: {
    member: Member
    isMe: boolean
    // Whether the reader owns the project, not whether this member does.
    isOwner: boolean
    canManage: boolean
    onRoleChange: (role: ProjectRole) => void
    onRemove: () => void
}) {
    return (
        <li className="flex items-center gap-3 py-2.5 first:pt-0">
            <PersonIdentity person={member} isMe={isMe} />

            {member.role === 'OWNER' ? (
                <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full shrink-0">
                    {ROLE_LABELS.OWNER}
                </span>
            ) : isOwner ? (
                <select
                    value={member.role}
                    onChange={(e) => onRoleChange(e.target.value as ProjectRole)}
                    className="h-7 rounded-lg border border-border-strong bg-surface-muted px-1.5 text-xs text-slate-600 outline-none focus:border-brand-500 transition shrink-0"
                    aria-label={`Rôle de ${member.username}`}
                >
                    <option value="MEMBER">{ROLE_LABELS.MEMBER}</option>
                    <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                </select>
            ) : (
                <span className="text-xs text-slate-400 shrink-0">{ROLE_LABELS[member.role]}</span>
            )}

            {member.role !== 'OWNER' && canManage && !isMe && (
                <button
                    onClick={onRemove}
                    className="text-slate-300 hover:text-red-500 transition text-xs leading-none shrink-0"
                    title={`Retirer ${member.username} du projet`}
                    aria-label={`Retirer ${member.username} du projet`}
                >
                    ✕
                </button>
            )}
        </li>
    )
}
