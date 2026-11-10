import { Trans, useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { dateLocale } from '../utils/dates'
import Navbar from '../components/Navbar'
import DeleteOwnAccountDialog from '../components/DeleteOwnAccountDialog'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import { useAuthStore } from '../store/authStore'

/**
 * The account page, at /compte. Where a person exercises the rights the
 * RGPD gives them over their data without having to ask anybody: take a
 * copy of it, or close the account.
 */
export default function AccountPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)
    const [exporting, setExporting] = useState(false)
    const [exportError, setExportError] = useState('')
    const [deleting, setDeleting] = useState(false)

    async function downloadData() {
        setExportError('')
        setExporting(true)
        try {
            const { data } = await api.get<Blob>('/auth/me/export', { responseType: 'blob' })
            const url = URL.createObjectURL(data)
            const link = document.createElement('a')
            link.href = url
            link.download = t('account.exportFile')
            link.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            setExportError(apiErrorMessage(err, t('account.exportFailed')))
        } finally {
            setExporting(false)
        }
    }

    function handleDeleted() {
        logout()
        navigate('/login', { replace: true })
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-app">
            <Navbar />

            <main className="max-w-2xl mx-auto px-6 py-8 space-y-5">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">{t('account.title')}</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        <Trans
                            i18nKey="account.subtitle"
                            components={{
                                anchor: <Link to="/confidentialite" className="text-brand-700 underline underline-offset-2" />,
                            }}
                        />
                    </p>
                </div>

                <section className="bg-surface border border-border rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-800 mb-3">{t('account.yourAccount')}</h2>
                    <dl className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-2 text-sm">
                        <dt className="text-slate-500">{t('account.username')}</dt>
                        <dd className="text-slate-800">{user.username}</dd>
                        <dt className="text-slate-500">{t('account.email')}</dt>
                        <dd className="text-slate-800 break-all">{user.email}</dd>
                        <dt className="text-slate-500">{t('account.createdOn')}</dt>
                        <dd className="text-slate-800">
                            {format(new Date(user.createdAt), 'd MMMM yyyy', { locale: dateLocale() })}
                        </dd>
                    </dl>
                </section>

                <section className="bg-surface border border-border rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-800 mb-1">{t('account.data')}</h2>
                    <p className="text-sm text-slate-500 mb-4">
                        {t('account.dataHint')}
                    </p>
                    <button
                        onClick={downloadData}
                        disabled={exporting}
                        className="h-9 px-4 rounded-lg border border-border-strong text-sm font-medium text-slate-700 hover:bg-surface-muted transition disabled:opacity-60"
                    >
                        {exporting ? t('account.preparing') : t('account.download')}
                    </button>
                    {exportError && (
                        <p role="alert" className="text-xs text-red-600 mt-3">
                            {exportError}
                        </p>
                    )}
                </section>

                <section className="bg-surface border border-red-200 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-800 mb-1">{t('account.delete')}</h2>
                    <p className="text-sm text-slate-500 mb-4">
                        {t('account.deleteHint')}
                    </p>
                    <button
                        onClick={() => setDeleting(true)}
                        className="h-9 px-4 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium transition"
                    >
                        {t('account.deleteOpen')}
                    </button>
                </section>
            </main>

            {deleting && <DeleteOwnAccountDialog onClose={() => setDeleting(false)} onDeleted={handleDeleted} />}
        </div>
    )
}
