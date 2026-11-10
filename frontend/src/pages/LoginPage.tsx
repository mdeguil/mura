import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import { useAuthStore } from '../store/authStore'
import PasswordInput from '../components/PasswordInput'
import LegalLinks from '../components/LegalLinks'
import Logo from '../components/Logo'

/**
 * The sign-in page, at /login: an address and a password, then the
 * projects.
 */
export default function LoginPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const setAuth = useAuthStore((s) => s.setAuth)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const { data } = await api.post('/auth/login', { email, password })
            setAuth(data.token, data.user)
            navigate('/projets')
        } catch (err) {
            setError(apiErrorMessage(err, t('auth.login.failed')))
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

                    <h1 className="text-xl font-semibold text-slate-800 mb-1">{t('auth.login.title')}</h1>
                    <p className="text-sm text-slate-500 mb-6">{t('auth.login.subtitle')}</p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="email" className="block text-xs font-medium text-slate-600 mb-1.5">{t('auth.email')}</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('common.emailPlaceholder')}
                                required
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="text-xs font-medium text-slate-600">{t('auth.password')}</label>
                                <Link to="/mot-de-passe-oublie" className="text-xs text-brand-600 hover:text-brand-700">{t('auth.login.forgot')}</Link>
                            </div>
                            <PasswordInput
                                id="password"
                                value={password}
                                onChange={setPassword}
                                autoComplete="current-password"
                                compact
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 h-9 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                        >
                            {loading ? t('auth.login.submitting') : t('auth.login.submit')}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-5">
                        {t('auth.login.noAccount')}{' '}
                        <Link to="/register" className="text-brand-600 font-medium hover:text-brand-700">
                            {t('auth.login.createAccount')}
                        </Link>
                    </p>
                </div>

                <LegalLinks className="mt-6" />
            </div>
        </div>
    )
}
