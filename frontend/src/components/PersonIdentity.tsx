import { useTranslation } from 'react-i18next'
import UserAvatar, { SuspendedPill } from './UserAvatar'
import type { User } from '../types'

/**
 * Who a row is about: face, name, and the address when the reader may see
 * it. The reader's own row says so.
 *
 * @param props the person, and whether it is the reader
 */
export default function PersonIdentity({
    person,
    isMe,
}: {
    /** The person. */
    person: User
    /** Whether the person is the reader; adds « · toi » (« · you »). */
    isMe: boolean
}) {
    const { t } = useTranslation()
    return (
        <>
            <UserAvatar user={person} />
            <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700 truncate flex items-center gap-1.5">
                    <span className="truncate">{person.username}</span>
                    {isMe && <span className="text-slate-400"> · {t('common.you')}</span>}
                    {person.suspended && <SuspendedPill />}
                </p>
                {person.email && <p className="text-xs text-slate-400 truncate">{person.email}</p>}
            </div>
        </>
    )
}
