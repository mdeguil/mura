import LegalLinks from '../components/LegalLinks'
import { Trans, useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import Logo from '../components/Logo'

/**
 * The forgotten-password page, at /mot-de-passe-oublie: asks for an address
 * and has a reset link mailed to it.
 */
export default function ForgotPasswordPage() {
    const { t } = useTranslation()
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await api.post('/auth/password/forgot', { email: email.trim() })
            setSent(true)
        } catch (err) {
            setError(apiErrorMessage(err, t('auth.forgot.failed')))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-app flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-7">
                        <Logo className="w-10 h-10" />
                        <span className="text-xl font-semibold text-slate-800">Mura</span>
                    </div>

                    {sent ? (
                        <>
                            <h1 className="text-xl font-semibold text-slate-800 mb-1">
                                {t('auth.forgot.sentTitle')}
                            </h1>
                            <p className="text-sm text-slate-500">
                                <Trans
                                    i18nKey="auth.forgot.sent"
                                    values={{ email: email.trim() }}
                                    components={{ strong: <span className="font-medium text-slate-700" /> }}
                                />
                            </p>
                            <button
                                onClick={() => setSent(false)}
                                className="text-sm text-brand-600 font-medium hover:text-brand-700 mt-5"
                            >
                                {t('auth.forgot.otherAddress')}
                            </button>
                        </>
                    ) : (
                        <>
                            <h1 className="text-xl font-semibold text-slate-800 mb-1">
                                {t('auth.forgot.title')}
                            </h1>
                            <p className="text-sm text-slate-500 mb-6">
                                {t('auth.forgot.subtitle')}
                            </p>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-xs font-medium text-slate-600 mb-1.5"
                                    >
                                        {t('auth.email')}
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t('common.emailPlaceholder')}
                                        autoComplete="email"
                                        required
                                        autoFocus
                                        className="w-full h-10 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                                    />
                                </div>

                                {error && (
                                    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !email.trim()}
                                    className="mt-1 h-10 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                                >
                                    {loading ? t('common.sending') : t('auth.forgot.submit')}
                                </button>
                            </form>
                        </>
                    )}

                    <p className="text-center text-sm text-slate-500 mt-5">
                        <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">
                            {t('auth.forgot.back')}
                        </Link>
                    </p>
                </div>

                <LegalLinks className="mt-6" />
            </div>
        </div>
    )
}
