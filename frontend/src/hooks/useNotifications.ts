import i18n from '../i18n'
import { useApiQuery } from './useApiQuery'
import api from '../services/api'
import type { AppNotification, Invitation } from '../types'

/**
 * A line in the bell. Two sources share it: invitations, which are waiting
 * for an answer and survive being cleared, and notifications, which only
 * report something that already happened and are deleted when cleared.
 */
export type BellItem =
    | { kind: 'invitation'; id: string; createdAt: string; read: boolean; invitation: Invitation }
    | { kind: 'notification'; id: string; createdAt: string; read: boolean; notification: AppNotification }

/**
 * What the bell holds, newest first, and the two things done to a line:
 * reading it and clearing it. Both change the screen at once and put things
 * back if the server refuses, so the bell never claims something it did not
 * get.
 *
 * A bell that cannot load stays empty rather than interrupting whatever
 * page it sits on: the same news also arrives by mail.
 *
 * @returns the `items`, newest first; how many are `unread`; and
 *          `markRead` and `clear` for one line
 */
export function useNotifications() {
    const invitationsQuery = useApiQuery<Invitation[]>('/invitations', [], '')
    const notificationsQuery = useApiQuery<AppNotification[]>('/notifications', [], '')
    const setInvitations = invitationsQuery.setData
    const setNotifications = notificationsQuery.setData

    const items: BellItem[] = [
        ...invitationsQuery.data
            .filter((invitation) => !invitation.dismissed)
            .map(
                (invitation): BellItem => ({
                    kind: 'invitation',
                    id: invitation.id,
                    createdAt: invitation.createdAt,
                    read: invitation.read,
                    invitation,
                })
            ),
        ...notificationsQuery.data.map(
            (notification): BellItem => ({
                kind: 'notification',
                id: notification.id,
                createdAt: notification.createdAt,
                read: notification.read,
                notification,
            })
        ),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const unread = items.filter((i) => !i.read).length

    function setRead(item: BellItem, read: boolean) {
        if (item.kind === 'invitation') {
            setInvitations((prev) => prev.map((i) => (i.id === item.id ? { ...i, read } : i)))
        } else {
            setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read } : n)))
        }
    }

    async function markRead(item: BellItem) {
        if (item.read) return

        setRead(item, true)
        try {
            const base = item.kind === 'invitation' ? 'invitations' : 'notifications'
            await api.post(`/${base}/${item.id}/read`)
        } catch {
            setRead(item, false)
        }
    }

    async function clear(item: BellItem) {
        if (item.kind === 'invitation') {
            setInvitations((prev) => prev.map((i) => (i.id === item.id ? { ...i, dismissed: true } : i)))
            try {
                await api.post(`/invitations/${item.id}/dismiss`)
            } catch {
                setInvitations((prev) => prev.map((i) => (i.id === item.id ? { ...i, dismissed: false } : i)))
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

    return { items, unread, markRead, clear }
}

/**
 * Where a line leads when it is opened, and what to call the place. A
 * notification about a project opens the project; one about a carnet entry
 * opens the carnet. The rest lead nowhere, and say so by offering nothing.
 *
 * @param item the line
 * @returns the address in the app and its name, or null
 */
export function destinationOf(item: BellItem): { href: string; label: string } | null {
    if (item.kind === 'invitation') {
        return item.invitation.projectId ? { href: `/project/${item.invitation.projectId}`, label: i18n.t('notifications.target.project') } : null
    }

    const { type, projectId, groupId, groupName } = item.notification
    if (type === 'CONTACT_REQUESTED' || type === 'CONTACT_ACCEPTED') {
        return { href: '/carnet', label: i18n.t('notifications.target.carnet') }
    }
    if (groupId) return { href: `/groupe/${groupId}`, label: i18n.t('notifications.target.group') }
    if (groupName) return { href: '/carnet', label: i18n.t('notifications.target.carnet') }
    return projectId ? { href: `/project/${projectId}`, label: i18n.t('notifications.target.project') } : null
}
