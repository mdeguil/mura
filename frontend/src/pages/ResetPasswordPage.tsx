import LegalLinks from '../components/LegalLinks'
import { useTranslation } from 'react-i18next'
import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import PasswordInput from '../components/PasswordInput'
import PasswordStrength from '../components/PasswordStrength'
import { passwordRules } from '../utils/passwordRules'
import Logo from '../components/Logo'

/**
 * The page a reset mail points at, /reset-password?token=…: a new password,
 * checked against the server's rules, set with the token from the link.
 */
export default function ResetPasswordPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const token = params.get('token') ?? ''

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    const rules = useMemo(() => passwordRules(password, '', ''), [password])
    const passwordOk = rules.every((r) => r.met)
    const confirmOk = confirmPassword.length > 0 && confirmPassword === password

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!passwordOk) {
            setError(t('auth.passwordIncomplete'))
            return
        }
        if (!confirmOk) {
            setError(t('auth.passwordsMismatch'))
            return
        }

        setLoading(true)
        try {
            await api.post('/auth/password/reset', { token, password })
            setDone(true)
            setTimeout(() => navigate('/login'), 2200)
        } catch (err) {
            setError(apiErrorMessage(err, t('auth.reset.failed')))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-app flex items-center justify-center p-4 py-10">
            <div className="w-full max-w-md">
                <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-7">
                        <Logo className="w-10 h-10" />
                        <span className="text-xl font-semibold text-slate-800">Mura</span>
                    </div>

                    {!token ? (
                        <>
                            <h1 className="text-xl font-semibold text-slate-800 mb-1">{t('auth.reset.incompleteTitle')}</h1>
                            <p className="text-sm text-slate-500">
                                {t('auth.reset.incomplete')}
                            </p>
                            <Link
                                to="/mot-de-passe-oublie"
                                className="inline-block text-sm text-brand-600 font-medium hover:text-brand-700 mt-5"
                            >
                                {t('auth.reset.newLink')}
                            </Link>
                        </>
                    ) : done ? (
                        <>
                            <h1 className="text-xl font-semibold text-slate-800 mb-1">
                                {t('auth.reset.doneTitle')}
                            </h1>
                            <p className="text-sm text-slate-500">
                                {t('auth.reset.done')}
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-xl font-semibold text-slate-800 mb-1">
                                {t('auth.reset.title')}
                            </h1>
                            <p className="text-sm text-slate-500 mb-6">
                                {t('auth.reset.subtitle')}
                            </p>

                            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-medium text-slate-600 mb-1.5"
                                    >
                                        {t('auth.reset.newPassword')}
                                    </label>
                                    <PasswordInput
                                        id="password"
                                        value={password}
                                        onChange={(value) => {
                                            setPassword(value)
                                            setError('')
                                        }}
                                        autoComplete="new-password"
                                    />
                                    {password.length > 0 && <PasswordStrength rules={rules} />}
                                </div>

                                <div>
                                    <label
                                        htmlFor="confirmPassword"
                                        className="block text-xs font-medium text-slate-600 mb-1.5"
                                    >
                                        {t('auth.confirmPassword')}
                                    </label>
                                    <PasswordInput
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(value) => {
                                            setConfirmPassword(value)
                                            setError('')
                                        }}
                                        autoComplete="new-password"
                                    />
                                    {confirmPassword.length > 0 && password.length > 0 && (
                                        <p
                                            className={`text-xs mt-1.5 ${
                                                confirmOk ? 'text-emerald-600' : 'text-slate-400'
                                            }`}
                                        >
                                            {confirmOk
                                                ? t('auth.passwordsMatch')
                                                : t('auth.passwordsDiffer')}
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                        {error}
                                    </p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="mt-1 h-10 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                                >
                                    {loading ? t('auth.reset.submitting') : t('auth.reset.submit')}
                                </button>
                            </form>
                        </>
                    )}
                </div>

                <LegalLinks className="mt-6" />
            </div>
        </div>
    )
}
