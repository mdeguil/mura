import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { destinationOf, useNotifications, type BellItem } from '../hooks/useNotifications'
import type { AppNotification } from '../types'

/**
 * The bell and its panel: invitations and notifications, newest first,
 * with the unread count on the bell. Opening a line marks it read; double
 * clicking it opens what it is about; clearing it removes it. A click
 * elsewhere or Escape closes the panel.
 */
export default function NotificationBell() {
    const navigate = useNavigate()
    const { items, unread, markRead, clear } = useNotifications()
    const [open, setOpen] = useState(false)
    const panel = useRef<HTMLDivElement>(null)

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
                                        onDoubleClick={() => openDestination(item)}
                                        className="flex-1 min-w-0 text-left px-4 py-3 flex gap-3 hover:bg-surface-muted transition"
                                        title={
                                            destinationOf(item)
                                                ? `Clic pour marquer comme lu, double-clic pour ouvrir ${destinationOf(item)!.label}`
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
                                                {destinationOf(item) &&
                                                    ` · double-clic pour voir ${destinationOf(item)!.label}`}
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
        case 'ADDED_TO_PROJECT':
            return (
                <>
                    {who} t'a ajouté à {name}
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
        case 'CONTACT_REQUESTED':
            return <>{who} aimerait t’ajouter à son carnet</>
        case 'CONTACT_ACCEPTED':
            return <>{who} a accepté ta demande de contact</>
        case 'MEMBER_DELETED':
            return (
                <>
                    Le compte de {who} a été supprimé — il était {where}
                </>
            )
        case 'GROUP_ENTRUSTED':
            return (
                <>
                    {who} t’a confié la gestion du groupe {name}
                </>
            )
        case 'GROUP_MANAGER_CHANGED':
            return (
                <>
                    Le groupe {name} est désormais géré par {who}
                </>
            )
        case 'GROUP_DELETED':
            return (
                <>
                    {who} a supprimé le groupe {name}
                </>
            )
        case 'ADDED_TO_GROUP':
            return (
                <>
                    {who} t’a ajouté au groupe {name}
                </>
            )
        case 'REMOVED_FROM_GROUP':
            return (
                <>
                    {who} t’a retiré du groupe {name}
                </>
            )
        case 'MEMBER_LEFT_GROUP':
            return (
                <>
                    {who} a quitté ton groupe {name}
                </>
            )
        // « En retrait », jamais « suspendu » : le compte n'est pas touché.
        case 'HELD_IN_GROUP':
            return (
                <>
                    {who} t’a mis en retrait du groupe {name}
                </>
            )
        case 'RESTORED_IN_GROUP':
            return (
                <>
                    {who} a levé ton retrait du groupe {name}
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
