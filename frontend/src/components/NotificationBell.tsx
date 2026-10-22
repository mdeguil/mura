import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import api from '../services/api'
import type { AppNotification, Invitation } from '../types'

// Two sources share the bell: invitations, which are waiting for an answer
// and survive being cleared, and notifications, which only report something
// that already happened and are deleted when cleared.
type Item =
    | { kind: 'invitation'; id: string; createdAt: string; read: boolean; invitation: Invitation }
    | { kind: 'notification'; id: string; createdAt: string; read: boolean; notification: AppNotification }

export default function NotificationBell() {
    const navigate = useNavigate()
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [notifications, setNotifications] = useState<AppNotification[]>([])
    const [open, setOpen] = useState(false)
    const panel = useRef<HTMLDivElement>(null)

    const items: Item[] = [
        ...invitations.map(
            (invitation): Item => ({
                kind: 'invitation',
                id: invitation.id,
                createdAt: invitation.createdAt,
                read: invitation.read,
                invitation,
            })
        ),
        ...notifications.map(
            (notification): Item => ({
                kind: 'notification',
                id: notification.id,
                createdAt: notification.createdAt,
                read: notification.read,
                notification,
            })
        ),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const unread = items.filter((i) => !i.read).length

    useEffect(() => {
        let cancelled = false

        api.get<Invitation[]>('/invitations')
            .then(({ data }) => {
                // Dismissed ones are gone from the bell for good; they are still
                // reachable from the projects list until answered.
                if (!cancelled) setInvitations(data.filter((i) => !i.dismissed))
            })
            .catch(() => {})

        api.get<AppNotification[]>('/notifications')
            .then(({ data }) => {
                if (!cancelled) setNotifications(data)
            })
            .catch(() => {})

        return () => {
            cancelled = true
        }
    }, [])

    // Clicking anywhere else closes the panel, the way a menu is expected to
    // behave; Échap does the same from the keyboard.
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

    function setRead(item: Item, read: boolean) {
        if (item.kind === 'invitation') {
            setInvitations((prev) => prev.map((i) => (i.id === item.id ? { ...i, read } : i)))
        } else {
            setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read } : n)))
        }
    }

    async function markRead(item: Item) {
        if (item.read) return

        setRead(item, true)
        try {
            const base = item.kind === 'invitation' ? 'invitations' : 'notifications'
            await api.post(`/${base}/${item.id}/read`)
        } catch {
            // Put the dot back rather than claiming it was read.
            setRead(item, false)
        }
    }

    // An invitation is only cleared from the bell — it still waits under
    // « À rejoindre ». A notification has nowhere else to live, so it goes.
    async function clear(item: Item) {
        if (item.kind === 'invitation') {
            setInvitations((prev) => prev.filter((i) => i.id !== item.id))
            try {
                await api.post(`/invitations/${item.id}/dismiss`)
            } catch {
                setInvitations((prev) => [...prev, item.invitation])
            }
        } else {
            setNotifications((prev) => prev.filter((n) => n.id !== item.id))
            try {
                await api.delete(`/notifications/${item.id}`)
            } catch {
                setNotifications((prev) => [...prev, item.notification])
            }
        }
    }

    function projectOf(item: Item) {
        return item.kind === 'invitation' ? item.invitation.projectId : item.notification.projectId
    }

    function openProject(item: Item) {
        const projectId = projectOf(item)
        if (!projectId) return
        setOpen(false)
        navigate(`/project/${projectId}`)
    }

    return (
        <div className="relative" ref={panel}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-surface-muted transition"
                title="Notifications"
                aria-label={unread > 0 ? `Notifications : ${unread} non lue(s)` : 'Notifications'}
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
                        {/* The halo is the only thing that moves: it fades out
                            on its own, so the header is not left pulsing. */}
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
                        <p className="text-sm font-semibold text-slate-800">Notifications</p>
                    </div>

                    {items.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-slate-400 text-center">
                            Rien de neuf pour le moment.
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
                                        onDoubleClick={() => openProject(item)}
                                        className="flex-1 min-w-0 text-left px-4 py-3 flex gap-3 hover:bg-surface-muted transition"
                                        title={
                                            projectOf(item)
                                                ? 'Clic pour marquer comme lu, double-clic pour ouvrir le projet'
                                                : 'Clic pour marquer comme lu'
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
                                                    <span className="font-medium">
                                                        {item.invitation.invitedBy.username}
                                                    </span>{' '}
                                                    t'invite à rejoindre{' '}
                                                    <span className="font-medium">
                                                        {item.invitation.projectName}
                                                    </span>
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
                                                    locale: fr,
                                                })}
                                                {projectOf(item) && ' · double-clic pour voir le projet'}
                                            </span>
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => clear(item)}
                                        className="px-3 text-slate-300 hover:text-red-500 transition text-xs leading-none shrink-0"
                                        title={
                                            item.kind === 'invitation'
                                                ? "Retirer de la cloche (l'invitation reste dans tes projets)"
                                                : 'Supprimer la notification'
                                        }
                                        aria-label="Supprimer la notification"
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

// One line per kind. A project notification names the project; an account
// one names whichever of the two the reader owns -- never the
// administrator who acted, whose identity is nobody else's business.
function NotificationLine({ notification }: { notification: AppNotification }) {
    const who = <span className="font-medium">{notification.actorName}</span>
    const name = (
        <span className="font-medium">{notification.projectName ?? notification.groupName}</span>
    )
    // The same news reaches a group owner and a project owner, so the line
    // has to say which of theirs it is about.
    const where = notification.groupName ? (
        <>dans ton groupe {name}</>
    ) : (
        <>sur ton projet {name}</>
    )

    switch (notification.type) {
        case 'REMOVED_FROM_PROJECT':
            return (
                <>
                    {who} t'a retiré de {name}
                </>
            )
        case 'MEMBER_SUSPENDED':
            return (
                <>
                    Le compte de {who} a été suspendu — il est {where}
                </>
            )
        case 'MEMBER_RESTORED':
            return (
                <>
                    Le compte de {who} est de nouveau actif — il est {where}
                </>
            )
        case 'MEMBER_DELETED':
            return (
                <>
                    Le compte de {who} a été supprimé — il était {where}
                </>
            )
        default:
            return (
                <>
                    {who} a quitté {name}
                </>
            )
    }
}
