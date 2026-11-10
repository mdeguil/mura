import { Trans, useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { dateLocale } from '../utils/dates'
import { destinationOf, useNotifications, type BellItem } from '../hooks/useNotifications'
import type { AppNotification, NotificationType } from '../types'

/**
 * The bell and its panel: invitations and notifications, newest first,
 * with the unread count on the bell. Opening a line marks it read; double
 * clicking it opens what it is about; clearing it removes it. A click
 * elsewhere or Escape closes the panel.
 */
export default function NotificationBell() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const { items, unread, markRead, clear } = useNotifications()
    const [open, setOpen] = useState(false)
    const panel = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return

        function onPointerDown(event: MouseEvent) {
            if (!panel.current?.contains(event.target as Node)) setOpen(false)
        }
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setOpen(false)
        }

        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open])

    function openDestination(item: BellItem) {
        const destination = destinationOf(item)
        if (!destination) return
        setOpen(false)
        navigate(destination.href)
    }

    return (
        <div className="relative" ref={panel}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-surface-muted transition"
                title={t('notifications.title')}
                aria-label={unread > 0 ? t('notifications.unread', { count: unread }) : t('notifications.title')}
                aria-expanded={open}
            >
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`w-5 h-5 ${unread > 0 ? 'text-slate-700' : ''}`}
                    aria-hidden="true"
                >
                    <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.7 21a2 2 0 0 1-3.4 0" />
                </svg>

                {unread > 0 && (
                    <>
                        <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-rose-400 animate-ping opacity-75 motion-reduce:hidden" />
                        <span className="absolute top-0.5 right-0.5 min-w-[1rem] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold leading-4 text-center">
                            {unread}
                        </span>
                    </>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-11 w-80 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-semibold text-slate-800">{t('notifications.title')}</p>
                    </div>

                    {items.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-slate-400 text-center">
                            {t('notifications.empty')}
                        </p>
                    ) : (
                        <ul className="max-h-96 overflow-y-auto">
                            {items.map((item) => (
                                <li
                                    key={item.id}
                                    className={`flex items-stretch border-b border-border last:border-b-0 ${
                                        item.read ? '' : 'bg-rose-50/40'
                                    }`}
                                >
                                    <button
                                        onClick={() => markRead(item)}
                                        onDoubleClick={() => openDestination(item)}
                                        className="flex-1 min-w-0 text-left px-4 py-3 flex gap-3 hover:bg-surface-muted transition"
                                        title={
                                            destinationOf(item)
                                                ? t('notifications.clickToReadOrOpen', { target: destinationOf(item)!.label })
                                                : t('notifications.clickToRead')
                                        }
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                                item.read ? 'bg-transparent' : 'bg-rose-500'
                                            }`}
                                        />
                                        <span className="min-w-0">
                                            {item.kind === 'invitation' ? (
                                                <span className="block text-sm text-slate-700">
                                                    <Trans
                                                        i18nKey="notifications.invitation"
                                                        values={{
                                                            actor: item.invitation.invitedBy.username,
                                                            name: item.invitation.projectName,
                                                        }}
                                                        components={{ b: <span className="font-medium" /> }}
                                                    />
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="block text-sm text-slate-700">
                                                        <NotificationLine notification={item.notification} />
                                                    </span>
                                                    {item.notification.message && (
                                                        <span className="block text-xs text-slate-500 mt-1 border-l-2 border-border-strong pl-2 italic">
                                                            {item.notification.message}
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                            <span className="block text-xs text-slate-400 mt-1">
                                                {formatDistanceToNow(new Date(item.createdAt), {
                                                    addSuffix: true,
                                                    locale: dateLocale(),
                                                })}
                                                {destinationOf(item) &&
                                                    t('notifications.doubleClickToSee', { target: destinationOf(item)!.label })}
                                            </span>
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => clear(item)}
                                        className="px-3 text-slate-300 hover:text-red-500 transition text-xs leading-none shrink-0"
                                        title={
                                            item.kind === 'invitation'
                                                ? t('notifications.removeInvitation')
                                                : t('notifications.delete')
                                        }
                                        aria-label={t('notifications.delete')}
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}

type LineKey =
    | Exclude<NotificationType, 'MEMBER_SUSPENDED' | 'MEMBER_RESTORED' | 'MEMBER_DELETED'>
    | `${'MEMBER_SUSPENDED' | 'MEMBER_RESTORED' | 'MEMBER_DELETED'}_${'project' | 'group'}`

/**
 * Which sentence tells a notification. Three kinds of line also say where
 * the person is, a project or a group, which changes the sentence; a type
 * the bell does not know reads as someone leaving.
 */
function lineKey(notification: AppNotification): LineKey {
    const { type } = notification
    if (type === 'MEMBER_SUSPENDED' || type === 'MEMBER_RESTORED' || type === 'MEMBER_DELETED') {
        return `${type}_${notification.groupName ? 'group' : 'project'}`
    }
    return type in LINE_TYPES ? type : 'MEMBER_LEFT_PROJECT'
}

const LINE_TYPES: Record<Exclude<LineKey, `${string}_${'project' | 'group'}`>, true> = {
    REMOVED_FROM_PROJECT: true,
    MEMBER_LEFT_PROJECT: true,
    ADDED_TO_PROJECT: true,
    CONTACT_REQUESTED: true,
    CONTACT_ACCEPTED: true,
    GROUP_ENTRUSTED: true,
    GROUP_MANAGER_CHANGED: true,
    GROUP_DELETED: true,
    ADDED_TO_GROUP: true,
    REMOVED_FROM_GROUP: true,
    MEMBER_LEFT_GROUP: true,
    HELD_IN_GROUP: true,
    RESTORED_IN_GROUP: true,
}

function NotificationLine({ notification }: { notification: AppNotification }) {
    return (
        <Trans
            i18nKey={`notifications.line.${lineKey(notification)}`}
            values={{ actor: notification.actorName, name: notification.projectName ?? notification.groupName }}
            components={{ b: <span className="font-medium" /> }}
        />
    )
}
