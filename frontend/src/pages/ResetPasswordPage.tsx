import React, { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import PasswordInput from '../components/PasswordInput'
import PasswordStrength, { passwordRules } from '../components/PasswordStrength'
import logo from '../assets/logo-icon.png'

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const [params] = useSearchParams()
    const token = params.get('token') ?? ''

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)

    // No email or username to compare against here: the link says who this
    // is, and the page deliberately does not.
    const rules = useMemo(() => passwordRules(password, '', ''), [password])
    const passwordOk = rules.every((r) => r.met)
    const confirmOk = confirmPassword.length > 0 && confirmPassword === password

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (!passwordOk) {
            setError('Ton mot de passe ne remplit pas encore toutes les conditions.')
            return
        }
        if (!confirmOk) {
            setError('Les deux mots de passe ne correspondent pas.')
            return
        }

        setLoading(true)
        try {
            await api.post('/auth/password/reset', { token, password })
            setDone(true)
            // A moment to read the confirmation before the login form
            // replaces it.
            setTimeout(() => navigate('/login'), 2200)
        } catch (err) {
            setError(apiErrorMessage(err, "Le mot de passe n'a pas pu être changé."))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-app flex items-center justify-center p-4 py-10">
            <div className="w-full max-w-md">
                <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-7">
                        <img src={logo} alt="Mura" className="w-10 h-10 rounded-full" />
                        <span className="text-xl font-semibold text-slate-800">Mura</span>
                    </div>

                    {!token ? (
                        <>
                            <h1 className="text-xl font-semibold text-slate-800 mb-1">Lien incomplet</h1>
                            <p className="text-sm text-slate-500">
                                Cette adresse ne porte aucun jeton. Ouvre le lien directement depuis le
                                mail, ou demandes-en un nouveau.
                            </p>
                            <Link
                                to="/mot-de-passe-oublie"
                                className="inline-block text-sm text-brand-600 font-medium hover:text-brand-700 mt-5"
                            >
                                Demander un nouveau lien
                            </Link>
                        </>
                    ) : done ? (
                        <>
                            <h1 className="text-xl font-semibold text-slate-800 mb-1">
                                Mot de passe changé ✅
                            </h1>
                            <p className="text-sm text-slate-500">
                                Tu peux te connecter avec le nouveau. On t'y emmène…
                            </p>
                        </>
                    ) : (
                        <>
                            <h1 className="text-xl font-semibold text-slate-800 mb-1">
                                Choisis un nouveau mot de passe
                            </h1>
                            <p className="text-sm text-slate-500 mb-6">
                                Il remplacera l'ancien immédiatement.
                            </p>

                            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="block text-xs font-medium text-slate-600 mb-1.5"
                                    >
                                        Nouveau mot de passe
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
                                        Confirmer le mot de passe
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
                                                ? 'Les deux mots de passe correspondent.'
                                                : 'Les deux mots de passe ne correspondent pas encore.'}
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
                                    className="mt-1 h-10 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                                >
                                    {loading ? 'Changement…' : 'Changer mon mot de passe'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
