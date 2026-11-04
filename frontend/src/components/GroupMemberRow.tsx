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
    return (
        <li className="flex items-center gap-3 py-2.5 first:pt-0">
            {/* En retrait : la ligne reste lisible mais s'efface, comme une
                tâche terminée. */}
            <div className={`flex items-center gap-3 min-w-0 flex-1 ${member.onHold ? 'opacity-50' : ''}`}>
                <PersonIdentity person={member} isMe={isMe} />
            </div>

            {isManager ? (
                <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full shrink-0">
                    Gérant
                </span>
            ) : (
                member.onHold && (
                    <span
                        className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full shrink-0"
                        title="Reste dans le groupe, mais ne sera pas ajouté aux projets avec lui. Son compte n'est pas touché."
                    >
                        En retrait
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
                                ? `${member.username} sera de nouveau ajouté aux projets avec le groupe`
                                : `${member.username} reste dans le groupe mais ne sera plus ajouté aux projets avec lui`
                        }
                    >
                        {member.onHold ? 'Réintégrer' : 'Mettre en retrait'}
                    </button>
                    <button
                        onClick={onRemove}
                        className="text-slate-300 hover:text-red-500 transition text-xs leading-none shrink-0"
                        title={`Retirer ${member.username} du groupe`}
                        aria-label={`Retirer ${member.username} du groupe`}
                    >
                        ✕
                    </button>
                </>
            )}
        </li>
    )
}
