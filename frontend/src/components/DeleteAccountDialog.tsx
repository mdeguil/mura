import { Trans, useTranslation } from 'react-i18next'
import { useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import { useApiQuery } from '../hooks/useApiQuery'
import Modal from './Modal'
import type { Account, AccountDeletionPreview } from '../types'

/**
 * An administrator deleting an account: what will happen, worked out by the
 * server, and the account's name to type back before anything is done.
 *
 * @param props the account and what to do once it is deleted
 */
export default function DeleteAccountDialog({
    account,
    onClose,
    onDeleted,
}: {
    /** The account to delete; it must already be suspended. */
    account: Account
    /** Closes the dialog without deleting. */
    onClose: () => void
    /** Called once the server has deleted it. */
    onDeleted: () => void
}) {
    const { t } = useTranslation()
    const { data: preview, error: previewError } = useApiQuery<AccountDeletionPreview | null>(
        `/admin/accounts/${account.id}/deletion-preview`,
        null,
        t('admin.deleteAccount.previewFailed')
    )
    const [typed, setTyped] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const matches = typed.trim() === account.username

    async function confirm() {
        if (!matches) return

        setError('')
        setLoading(true)
        try {
            await api.delete(`/admin/accounts/${account.id}`)
            onDeleted()
        } catch (err) {
            setError(apiErrorMessage(err, t('admin.deleteAccount.failed')))
            setLoading(false)
        }
    }

    return (
        <Modal labelledBy="delete-account-title" onClose={onClose} size="lg" className="overflow-hidden">
            <span className="block h-1.5 bg-red-500" />

            <div className="px-6 pt-5 pb-4 border-b border-border">
                <h2 id="delete-account-title" className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <span aria-hidden="true">🗑️</span>
                    {t('admin.deleteAccount.title', { name: account.username })}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">{t('admin.deleteAccount.subtitle')}</p>
            </div>

            <div className="px-6 py-5 max-h-[50vh] overflow-y-auto">
                {!preview && !previewError && <p className="text-sm text-slate-500">{t('admin.deleteAccount.checking')}</p>}

                {preview && (
                    <>
                        <DeletionConsequences preview={preview} own={false} />

                        <form
                            onSubmit={(e) => {
                                e.preventDefault()
                                confirm()
                            }}
                            className="mt-5"
                        >
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">
                                {t('admin.deleteAccount.typeName', { name: account.username })}
                            </label>
                            <input
                                type="text"
                                value={typed}
                                onChange={(e) => setTyped(e.target.value)}
                                autoFocus
                                className="w-full h-10 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 outline-none focus:border-red-400 transition"
                            />
                        </form>
                    </>
                )}

                {(previewError || error) && (
                    <p role="alert" className="text-xs text-red-600 mt-3">
                        {previewError || error}
                    </p>
                )}
            </div>

            <div className="px-6 py-4 border-t border-border bg-surface-muted/60 flex justify-end gap-2">
                <button
                    onClick={onClose}
                    className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface transition"
                >
                    {t('common.cancel')}
                </button>
                <button
                    onClick={confirm}
                    disabled={!matches || loading || !preview}
                    className="h-9 px-4 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition disabled:opacity-40 disabled:hover:bg-red-500"
                >
                    {loading ? t('admin.deleteAccount.submitting') : t('admin.deleteAccount.submit')}
                </button>
            </div>
        </Modal>
    )
}

/**
 * What deleting an account does, as the server worked it out: shared by the
 * administrator's dialog and the one where someone closes their own
 * account.
 *
 * @param props the consequences, and who the sentences speak to
 */
export function DeletionConsequences({
    preview,
    own,
}: {
    /** The consequences the server worked out. */
    preview: AccountDeletionPreview
    /** True when the reader is closing their own account: the sentences speak to them. */
    own: boolean
}) {
    const { t } = useTranslation()
    const n = preview.tasksUnassigned

    return (
        <>
            {preview.projectsTransferred.length > 0 && (
                <Section tone="keep" title={t('admin.consequences.transferred')}>
                    {preview.projectsTransferred.map((p) => (
                        <Row key={p.projectName} tone="keep">
                            <Trans
                                i18nKey="admin.consequences.transferredTo"
                                values={{ project: p.projectName, successor: p.successorUsername }}
                                components={{ strong: <strong className="font-medium" /> }}
                            />
                        </Row>
                    ))}
                </Section>
            )}

            {preview.projectsDeleted.length > 0 && (
                <Section tone="lose" title={t('admin.consequences.deleted')}>
                    {preview.projectsDeleted.map((name) => (
                        <Row key={name} tone="lose">
                            <Trans
                                i18nKey="admin.consequences.deletedProject"
                                values={{ project: name }}
                                components={{ strong: <strong className="font-medium" /> }}
                            />
                        </Row>
                    ))}
                </Section>
            )}

            {preview.groupsDeleted.length > 0 && (
                <Section tone="lose" title={t('admin.consequences.groupsDeleted')}>
                    {preview.groupsDeleted.map((name) => (
                        <Row key={name} tone="lose">
                            {name}
                        </Row>
                    ))}
                </Section>
            )}

            {n > 0 && (
                <Section tone="keep" title={t('admin.consequences.kept')}>
                    <Row tone="keep">
                        {own ? t('admin.consequences.tasksOwn', { count: n }) : t('admin.consequences.tasksOther', { count: n })}
                    </Row>
                </Section>
            )}
        </>
    )
}

function Section({
    title,
    tone,
    children,
}: {
    title: string
    tone: 'keep' | 'lose'
    children: React.ReactNode
}) {
    return (
        <div className="mb-4 last:mb-0">
            <p
                className={`text-xs font-medium mb-1.5 ${
                    tone === 'lose' ? 'text-red-600' : 'text-slate-600'
                }`}
            >
                {title}
            </p>
            <ul className="flex flex-col gap-1">{children}</ul>
        </div>
    )
}

function Row({ tone, children }: { tone: 'keep' | 'lose'; children: React.ReactNode }) {
    return (
        <li className="flex gap-2 text-sm text-slate-600">
            <span className={tone === 'lose' ? 'text-red-500' : 'text-emerald-500'} aria-hidden="true">
                {tone === 'lose' ? '✕' : '→'}
            </span>
            <span>{children}</span>
        </li>
    )
}
