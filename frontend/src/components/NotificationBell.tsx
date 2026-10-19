import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import api from '../services/api'
import type { Invitation } from '../types'

export default function NotificationBell() {
    const navigate = useNavigate()
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [open, setOpen] = useState(false)
    const panel = useRef<HTMLDivElement>(null)

    const unread = invitations.filter((i) => !i.read).length

    useEffect(() => {
        let cancelled = false

        api.get<Invitation[]>('/invitations')
            .then(({ data }) => {
                // Dismissed ones are gone from the bell for good; they are still
                // reachable from the projects list until answered.
                if (!cancelled) setInvitations(data.filter((i) => !i.dismissed))
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

    async function markRead(invitation: Invitation) {
        if (invitation.read) return

        setInvitations((prev) =>
            prev.map((i) => (i.id === invitation.id ? { ...i, read: true } : i))
        )
        try {
            await api.post(`/invitations/${invitation.id}/read`)
        } catch {
            // Put the dot back rather than claiming it was read.
            setInvitations((prev) =>
                prev.map((i) => (i.id === invitation.id ? { ...i, read: false } : i))
            )
        }
    }

    // Clearing the notification is not answering the invitation: it leaves
    // the bell, and the projects list still offers it under « À rejoindre ».
    async function dismiss(invitation: Invitation) {
        setInvitations((prev) => prev.filter((i) => i.id !== invitation.id))
        try {
            await api.post(`/invitations/${invitation.id}/dismiss`)
        } catch {
            setInvitations((prev) =>
                [...prev, invitation].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
            )
        }
    }

    function openProject(invitation: Invitation) {
        setOpen(false)
        navigate(`/project/${invitation.projectId}`)
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

                    {invitations.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-slate-400 text-center">
                            Rien de neuf pour le moment.
                        </p>
                    ) : (
                        <ul className="max-h-80 overflow-y-auto">
                            {invitations.map((invitation) => (
                                <li
                                    key={invitation.id}
                                    className={`flex items-stretch border-b border-border last:border-b-0 ${
                                        invitation.read ? '' : 'bg-rose-50/40'
                                    }`}
                                >
                                    <button
                                        onClick={() => markRead(invitation)}
                                        onDoubleClick={() => openProject(invitation)}
                                        className="flex-1 min-w-0 text-left px-4 py-3 flex gap-3 hover:bg-surface-muted transition"
                                        title="Clic pour marquer comme lu, double-clic pour ouvrir le projet"
                                    >
                                        <span
                                            className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                                                invitation.read ? 'bg-transparent' : 'bg-rose-500'
                                            }`}
                                        />
                                        <span className="min-w-0">
                                            <span className="block text-sm text-slate-700">
                                                <span className="font-medium">
                                                    {invitation.invitedBy.username}
                                                </span>{' '}
                                                t'invite à rejoindre{' '}
                                                <span className="font-medium">{invitation.projectName}</span>
                                            </span>
                                            <span className="block text-xs text-slate-400 mt-0.5">
                                                {formatDistanceToNow(new Date(invitation.createdAt), {
                                                    addSuffix: true,
                                                    locale: fr,
                                                })}
                                                {' · double-clic pour voir le projet'}
                                            </span>
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => dismiss(invitation)}
                                        className="px-3 text-slate-300 hover:text-red-500 transition text-xs leading-none shrink-0"
                                        title="Supprimer la notification (l'invitation reste dans tes projets)"
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
