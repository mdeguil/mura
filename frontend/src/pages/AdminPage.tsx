import { Trans, useTranslation } from 'react-i18next'
import i18n from '../i18n'
import { useState } from 'react'
import { format } from 'date-fns'
import { dateLocale } from '../utils/dates'
import Navbar from '../components/Navbar'
import ConfirmDialog from '../components/ConfirmDialog'
import UserAvatar from '../components/UserAvatar'
import DeleteAccountDialog from '../components/DeleteAccountDialog'
import ProjectTypeAdmin from '../components/ProjectTypeAdmin'
import AdminGroupList from '../components/AdminGroupList'
import ErrorMessage from '../components/ErrorMessage'
import { useApiQuery } from '../hooks/useApiQuery'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import { useAuthStore } from '../store/authStore'
import type { Account, AccountRole } from '../types'

type Pending =
    | { kind: 'role'; account: Account; role: AccountRole }
    | { kind: 'suspend'; account: Account; suspended: boolean }

/**
 * The administration, at /administration, for administrators only, in
 * three tabs: the accounts with their role and suspension, the groups and
 * the project types. A role change or a suspension is confirmed before it
 * is sent.
 */
export default function AdminPage() {
    const { t } = useTranslation()
    const me = useAuthStore((s) => s.user)
    const setUser = useAuthStore((s) => s.setUser)
    const {
        data: accounts,
        setData: setAccounts,
        loading,
        error: loadError,
        reload,
    } = useApiQuery<Account[]>('/admin/accounts', [], t('admin.accounts.loadFailed'))
    const [error, setError] = useState('')
    const [pending, setPending] = useState<Pending | null>(null)
    const [deleting, setDeleting] = useState<Account | null>(null)
    const [tab, setTab] = useState<'accounts' | 'types' | 'groups'>('accounts')


    function replace(account: Account) {
        setAccounts((prev) =>
            prev
                .map((a) => (a.id === account.id ? account : a))
                .sort(
                    (a, b) =>
                        Number(b.accountRole === 'ADMIN') - Number(a.accountRole === 'ADMIN') ||
                        a.username.localeCompare(b.username, 'fr', { sensitivity: 'base' })
                )
        )
        if (me && account.id === me.id) setUser(account)
    }

    async function apply(action: Pending) {
        setError('')
        try {
            const { data } =
                action.kind === 'role'
                    ? await api.put<Account>(`/admin/accounts/${action.account.id}/role`, {
                          accountRole: action.role,
                      })
                    : await api.put<Account>(`/admin/accounts/${action.account.id}/suspension`, {
                          suspended: action.suspended,
                      })
            replace(data)
            setPending(null)
        } catch (err) {
            setError(apiErrorMessage(err, t('admin.accounts.actionFailed')))
            setPending(null)
        }
    }

    const admins = accounts.filter((a) => a.accountRole === 'ADMIN' && !a.suspended).length

    return (
        <div className="min-h-screen bg-app">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 py-8">
                <h1 className="text-xl font-semibold text-slate-800">{t('admin.title')}</h1>
                <p className="text-sm text-slate-500 mt-1">
                    {t('admin.subtitle')}
                </p>

                <div className="flex items-center gap-1 mt-5 border-b border-border">
                    {([
                        ['accounts', t('admin.tabs.accounts')],
                        ['types', t('admin.tabs.types')],
                        ['groups', t('admin.tabs.groups')],
                    ] as const).map(([key, label]) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`h-9 px-3 -mb-px border-b-2 text-sm font-medium transition ${
                                tab === key
                                    ? 'border-brand-500 text-slate-800'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="mt-6">
                {tab === 'types' && <ProjectTypeAdmin />}
                {tab === 'groups' && <AdminGroupList />}
                {tab === 'accounts' && (
                <>

                {loadError && (
                    <ErrorMessage onRetry={reload} className="mt-4">
                        {loadError}
                    </ErrorMessage>
                )}

                {error && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mt-4">
                        {error}
                    </p>
                )}

                {loading ? (
                    <p className="text-sm text-slate-500 mt-6">{t('common.loading')}</p>
                ) : (
                    <div className="bg-surface border border-border rounded-2xl mt-6 overflow-hidden">
                        <div className="px-5 py-3 border-b border-border bg-surface-muted/60 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-600">
                                {t('admin.accounts.count', { count: accounts.length })}
                            </span>
                            <span className="text-xs text-slate-400">
                                {t('admin.accounts.admins', { count: admins })}
                            </span>
                        </div>

                        <ul>
                            {accounts.map((account) => {
                                const isMe = account.id === me?.id
                                const isAdmin = account.accountRole === 'ADMIN'

                                return (
                                    <li
                                        key={account.id}
                                        className="px-5 py-4 border-b border-border last:border-b-0 flex items-center gap-4"
                                    >
                                        <UserAvatar user={account} />

                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                                                {account.username}
                                                {isMe && <span className="text-xs text-slate-400">· {t('common.you')}</span>}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">{account.email}</p>
                                        </div>

                                        <div className="hidden sm:block text-xs text-slate-400 shrink-0">
                                            {t('admin.accounts.joined', {
                                                date: format(new Date(account.createdAt), 'd MMM yyyy', { locale: dateLocale() }),
                                            })}
                                        </div>

                                        <span
                                            className={`shrink-0 w-28 text-center text-xs font-medium rounded-full px-2.5 py-1 border ${
                                                account.suspended
                                                    ? 'border-red-200 bg-red-50 text-red-600'
                                                    : isAdmin
                                                      ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                      : 'border-border-strong bg-surface-muted text-slate-500'
                                            }`}
                                        >
                                            {account.suspended
                                                ? t('admin.accounts.suspended')
                                                : isAdmin
                                                  ? t('admin.accounts.administrator')
                                                  : t('admin.accounts.user')}
                                        </span>

                                        <div className="flex items-center justify-end gap-2 shrink-0 w-[272px]">
                                            <button
                                                onClick={() =>
                                                    setPending({
                                                        kind: 'role',
                                                        account,
                                                        role: isAdmin ? 'USER' : 'ADMIN',
                                                    })
                                                }
                                                className="h-8 px-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium transition"
                                            >
                                                {isAdmin ? t('admin.accounts.removeRole') : t('admin.accounts.makeAdmin')}
                                            </button>

                                            {!isMe && (
                                                <button
                                                    onClick={() =>
                                                        setPending({
                                                            kind: 'suspend',
                                                            account,
                                                            suspended: !account.suspended,
                                                        })
                                                    }
                                                    className={`h-8 px-3 rounded-lg border text-xs font-medium transition ${
                                                        account.suspended
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                                                    }`}
                                                >
                                                    {account.suspended ? t('admin.accounts.restore') : t('admin.accounts.suspend')}
                                                </button>
                                            )}

                                            {!isMe && account.suspended && (
                                                <button
                                                    onClick={() => setDeleting(account)}
                                                    className="h-8 w-8 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition flex items-center justify-center"
                                                    aria-label={t('admin.accounts.deleteLabel', { name: account.username })}
                                                    title={t('admin.accounts.deleteForever')}
                                                >
                                                    <svg viewBox="0 0 24 24" className="w-[16px] h-[16px]" fill="none"
                                                         stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                                         strokeLinejoin="round" aria-hidden="true">
                                                        <path d="M3 6h18" />
                                                        <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                                                        <path d="M19 6l-1 14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 6" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                )}
                </>
                )}
            </div>
            </main>

            {pending && (
                <ConfirmDialog
                    title={dialogTitle(pending, pending.account.id === me?.id)}
                    body={dialogBody(pending, pending.account.id === me?.id)}
                    confirmLabel={dialogConfirm(pending)}
                    icon={pending.kind === 'suspend' && pending.suspended ? '🚫' : '🛡️'}
                    tone={
                        pending.kind === 'suspend' && pending.suspended
                            ? 'danger'
                            : pending.kind === 'role' && pending.role === 'USER'
                              ? 'danger'
                              : 'neutral'
                    }
                    onCancel={() => setPending(null)}
                    onConfirm={() => apply(pending)}
                />
            )}

            {deleting && (
                <DeleteAccountDialog
                    account={deleting}
                    onClose={() => setDeleting(null)}
                    onDeleted={() => {
                        setAccounts((prev) => prev.filter((a) => a.id !== deleting.id))
                        setDeleting(null)
                    }}
                />
            )}
        </div>
    )
}

function dialogTitle(pending: Pending, isMe: boolean): string {
    const name = pending.account.username
    if (pending.kind === 'suspend') {
        return pending.suspended ? i18n.t('admin.dialog.suspendTitle', { name }) : i18n.t('admin.dialog.restoreTitle', { name })
    }
    if (pending.role === 'ADMIN') return i18n.t('admin.dialog.makeAdminTitle', { name })
    return isMe ? i18n.t('admin.dialog.dropOwnRoleTitle') : i18n.t('admin.dialog.removeRoleTitle', { name })
}

function dialogBody(pending: Pending, isMe: boolean) {
    const key =
        pending.kind === 'suspend'
            ? pending.suspended
                ? 'admin.dialog.suspendBody'
                : 'admin.dialog.restoreBody'
            : pending.role === 'ADMIN'
              ? 'admin.dialog.makeAdminBody'
              : isMe
                ? 'admin.dialog.dropOwnRoleBody'
                : 'admin.dialog.removeRoleBody'
    return <Trans i18nKey={key} values={{ name: pending.account.username }} components={{ strong: <strong /> }} />
}

function dialogConfirm(pending: Pending): string {
    if (pending.kind === 'suspend') {
        return pending.suspended ? i18n.t('admin.dialog.suspend') : i18n.t('admin.dialog.restore')
    }
    return pending.role === 'ADMIN' ? i18n.t('admin.dialog.makeAdmin') : i18n.t('admin.dialog.removeRole')
}
