import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { apiErrorField, apiErrorMessage } from '../utils/apiError'
import { useAuthStore } from '../store/authStore'
import PasswordInput from '../components/PasswordInput'
import PasswordStrength from '../components/PasswordStrength'
import { passwordRules } from '../utils/passwordRules'
import LegalLinks from '../components/LegalLinks'
import Logo from '../components/Logo'

const USERNAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N}._-]*$/u

type Field = 'username' | 'email' | 'password' | 'confirmPassword'

/**
 * The sign-up page, at /register: a username, an address and a password
 * checked against the server's rules as they are typed, then the code
 * screen.
 */
export default function RegisterPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((s) => s.setAuth)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [errorField, setErrorField] = useState<Field | null>(null)
    const [loading, setLoading] = useState(false)

    const rules = useMemo(() => passwordRules(password, email, username), [password, email, username])
    const passwordOk = rules.every((r) => r.met)
    const usernameOk = username.trim().length >= 3 && USERNAME_PATTERN.test(username.trim())
    const confirmOk = confirmPassword.length > 0 && confirmPassword === password

    function fail(message: string, field: Field | null) {
        setError(message)
        setErrorField(field)
    }

    function edit(setter: (v: string) => void) {
        return (value: string) => {
            setter(value)
            if (error) {
                setError('')
                setErrorField(null)
            }
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setErrorField(null)

        if (!usernameOk) {
            return fail(
                username.trim().length < 3
                    ? "Le nom d'utilisateur doit contenir au moins 3 caractères."
                    : "Le nom d'utilisateur accepte les lettres, chiffres, point, tiret et underscore, sans espace.",
                'username'
            )
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            return fail("Cette adresse email n'a pas l'air valide.", 'email')
        }
        if (!passwordOk) {
            return fail('Ton mot de passe ne remplit pas encore toutes les conditions.', 'password')
        }
        if (!confirmOk) {
            return fail('Les mots de passe ne correspondent pas.', 'confirmPassword')
        }

        setLoading(true)
        try {
            const { data } = await api.post('/auth/register', {
                username: username.trim(),
                email: email.trim(),
                password,
            })
            setAuth(data.token, data.user)
            navigate('/projets')
        } catch (err) {
            const field = apiErrorField(err)
            fail(
                apiErrorMessage(err, 'Impossible de créer le compte. Vérifie tes informations.'),
                field === 'username' || field === 'email' || field === 'password' ? field : null
            )
        } finally {
            setLoading(false)
        }
    }

    function inputClass(field: Field, extra = '') {
        return `w-full h-10 rounded-lg border bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition ${
            errorField === field
                ? 'border-red-300 focus:border-red-400'
                : 'border-border-strong focus:border-brand-500'
        } ${extra}`
    }

    function fieldError(field: Field) {
        if (errorField !== field) return null
        return <p className="text-xs text-red-500 mt-1.5">{error}</p>
    }

    return (
        <div className="min-h-screen bg-app flex items-center justify-center p-4 py-10">
            <div className="w-full max-w-md">
                <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">

                    <div className="flex items-center gap-2.5 mb-7">
                        <Logo className="w-10 h-10" />
                        <span className="text-xl font-semibold text-slate-800">Mura</span>
                    </div>

                    <h1 className="text-xl font-semibold text-slate-800 mb-1">Créer un compte ✨</h1>
                    <p className="text-sm text-slate-500 mb-6">Rejoins Mura pour organiser tes projets</p>

                    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                        <div>
                            <label htmlFor="username" className="block text-xs font-medium text-slate-600 mb-1.5">
                                Nom d'utilisateur
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => edit(setUsername)(e.target.value)}
                                placeholder="toncompte"
                                autoComplete="username"
                                maxLength={50}
                                className={inputClass('username')}
                            />
                            {fieldError('username') ?? (
                                <p className="text-xs text-slate-400 mt-1.5">
                                    C'est le nom que les autres verront sur tes projets. Lettres, chiffres,
                                    point, tiret et underscore.
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-xs font-medium text-slate-600 mb-1.5">
                                Adresse email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => edit(setEmail)(e.target.value)}
                                placeholder="toi@exemple.com"
                                autoComplete="email"
                                maxLength={255}
                                className={inputClass('email')}
                            />
                            {fieldError('email') ?? (
                                <p className="text-xs text-slate-400 mt-1.5">
                                    C'est avec cet email qu'on t'invitera sur un projet.
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-xs font-medium text-slate-600 mb-1.5">
                                Mot de passe
                            </label>
                            <PasswordInput
                                id="password"
                                value={password}
                                onChange={edit(setPassword)}
                                autoComplete="new-password"
                                invalid={errorField === 'password'}
                            />
                            {fieldError('password')}
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
                                onChange={edit(setConfirmPassword)}
                                autoComplete="new-password"
                                invalid={errorField === 'confirmPassword'}
                            />
                            {fieldError('confirmPassword') ??
                                (confirmPassword.length > 0 && password.length > 0 && (
                                    <p
                                        className={`text-xs mt-1.5 ${
                                            confirmOk ? 'text-emerald-600' : 'text-slate-400'
                                        }`}
                                    >
                                        {confirmOk
                                            ? 'Les deux mots de passe correspondent.'
                                            : 'Les deux mots de passe ne correspondent pas encore.'}
                                    </p>
                                ))}
                        </div>

                        {error && errorField === null && (
                            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 h-10 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                        >
                            {loading ? 'Création…' : 'Créer mon compte'}
                        </button>
                    </form>

                    <p className="text-xs text-slate-500 mt-4">
                        Mura conserve ton nom d'utilisateur, ton adresse e-mail et ton mot de passe haché pour
                        faire fonctionner ton compte. Le détail, et tes droits, sont dans la{' '}
                        <Link to="/confidentialite" className="text-brand-700 underline underline-offset-2">
                            politique de confidentialité
                        </Link>
                        .
                    </p>

                    <p className="text-center text-sm text-slate-500 mt-5">
                        Déjà un compte ?{' '}
                        <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">
                            Se connecter
                        </Link>
                    </p>
                </div>

                <LegalLinks className="mt-6" />
            </div>
        </div>
    )
}
