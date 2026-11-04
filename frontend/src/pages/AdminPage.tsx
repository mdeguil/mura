import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
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

export default function AdminPage() {
    const me = useAuthStore((s) => s.user)
    const setUser = useAuthStore((s) => s.setUser)
    const {
        data: accounts,
        setData: setAccounts,
        loading,
        error: loadError,
        reload,
    } = useApiQuery<Account[]>('/admin/accounts', [], 'Impossible de charger les comptes.')
    const [error, setError] = useState('')
    const [pending, setPending] = useState<Pending | null>(null)
    const [deleting, setDeleting] = useState<Account | null>(null)
    const [tab, setTab] = useState<'accounts' | 'types' | 'groups'>('accounts')


    function replace(account: Account) {
        setAccounts((prev) =>
            prev
                .map((a) => (a.id === account.id ? account : a))
                // The same order the server sends: administrators first,
                // then alphabetically. Without it a promotion leaves the
                // row where it was until the next reload.
                .sort(
                    (a, b) =>
                        Number(b.accountRole === 'ADMIN') - Number(a.accountRole === 'ADMIN') ||
                        a.username.localeCompare(b.username, 'fr', { sensitivity: 'base' })
                )
        )
        // Stepping down from the role is allowed, and the navigation has to
        // notice: this page is about to stop being reachable.
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
            setError(apiErrorMessage(err, "L'action n'a pas pu être effectuée."))
            setPending(null)
        }
    }

    const admins = accounts.filter((a) => a.accountRole === 'ADMIN' && !a.suspended).length

    return (
        <div className="min-h-screen bg-app">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 py-8">
                <h1 className="text-xl font-semibold text-slate-800">Administration</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Ce que les comptes peuvent faire de Mura, les types de projet proposés, et les
                    groupes et leurs gérants.
                </p>

                <div className="flex items-center gap-1 mt-5 border-b border-border">
                    {([
                        ['accounts', 'Comptes'],
                        ['types', 'Types de projet'],
                        ['groups', 'Groupes'],
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
                    <p className="text-sm text-slate-500 mt-6">Chargement…</p>
                ) : (
                    <div className="bg-surface border border-border rounded-2xl mt-6 overflow-hidden">
                        <div className="px-5 py-3 border-b border-border bg-surface-muted/60 flex items-center justify-between">
                            <span className="text-xs font-medium text-slate-600">
                                {accounts.length} compte{accounts.length > 1 ? 's' : ''}
                            </span>
                            <span className="text-xs text-slate-400">
                                {admins} administrateur{admins > 1 ? 's' : ''} actif{admins > 1 ? 's' : ''}
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
                                                {isMe && <span className="text-xs text-slate-400">· toi</span>}
                                            </p>
                                            <p className="text-xs text-slate-400 truncate">{account.email}</p>
                                        </div>

                                        <div className="hidden sm:block text-xs text-slate-400 shrink-0">
                                            inscrit le{' '}
                                            {format(new Date(account.createdAt), 'd MMM yyyy', { locale: fr })}
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
                                                ? 'Suspendu'
                                                : isAdmin
                                                  ? 'Administrateur'
                                                  : 'Utilisateur'}
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
                                                {isAdmin ? 'Retirer le rôle' : 'Nommer admin'}
                                            </button>

                                            {/* Suspending yourself locks you out on the spot and
                                                only someone else can undo it, so the button is
                                                not offered at all. */}
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
                                                    {account.suspended ? 'Réactiver' : 'Suspendre'}
                                                </button>
                                            )}

                                            {/* Only once suspended, the way a project is
                                                archived before it can be deleted: a step
                                                in front of something irreversible. */}
                                            {!isMe && account.suspended && (
                                                <button
                                                    onClick={() => setDeleting(account)}
                                                    className="h-8 w-8 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition flex items-center justify-center"
                                                    aria-label={`Supprimer le compte de ${account.username}`}
                                                    title="Supprimer définitivement"
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
    if (pending.kind === 'suspend') {
        return pending.suspended
            ? `Suspendre ${pending.account.username} ?`
            : `Réactiver ${pending.account.username} ?`
    }
    if (pending.role === 'ADMIN') return `Nommer ${pending.account.username} administrateur ?`
    return isMe ? 'Abandonner ton rôle d’administrateur ?' : `Retirer le rôle à ${pending.account.username} ?`
}

function dialogBody(pending: Pending, isMe: boolean) {
    if (pending.kind === 'suspend') {
        return pending.suspended ? (
            <>
                <strong>{pending.account.username}</strong> ne pourra plus se connecter, et sa session en
                cours s’arrêtera immédiatement. Ses projets, ses tâches et ses messages restent en place,
                et tu peux le réactiver à tout moment.
            </>
        ) : (
            <>
                <strong>{pending.account.username}</strong> pourra de nouveau se connecter et retrouvera
                tout ce qu’il avait.
            </>
        )
    }

    if (pending.role === 'ADMIN') {
        return (
            <>
                <strong>{pending.account.username}</strong> pourra voir tous les comptes, nommer d’autres
                administrateurs et suspendre un compte. Cela ne lui donne aucun accès aux projets dont il
                n’est pas membre.
            </>
        )
    }

    return isMe ? (
        <>
            Tu perdras l’accès à cette page immédiatement. Il faudra qu’un autre administrateur te
            renomme pour revenir.
        </>
    ) : (
        <>
            <strong>{pending.account.username}</strong> gardera son compte et ses projets, mais perdra
            l’accès à l’administration dès maintenant.
        </>
    )
}

function dialogConfirm(pending: Pending): string {
    if (pending.kind === 'suspend') return pending.suspended ? 'Suspendre' : 'Réactiver'
    return pending.role === 'ADMIN' ? 'Nommer administrateur' : 'Retirer le rôle'
}
