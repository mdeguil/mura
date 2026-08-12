import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import logo from '../assets/logo-icon.png'

export default function RegisterPage() {
    const navigate = useNavigate()
    const setAuth = useAuthStore((s) => s.setAuth)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas.')
            return
        }

        setLoading(true)
        try {
            const { data } = await api.post('/auth/register', { username, email, password })
            setAuth(data.token, data.user)
            navigate('/')
        } catch {
            setError('Impossible de créer le compte. Vérifie tes informations.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-app flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">

                    {/* Logo */}
                    <div className="flex items-center gap-2.5 mb-7">
                        <img src={logo} alt="Mura" className="w-10 h-10 rounded-full" />
                        <span className="text-xl font-semibold text-slate-800">Mura</span>
                    </div>

                    <h1 className="text-xl font-semibold text-slate-800 mb-1">Créer un compte ✨</h1>
                    <p className="text-sm text-slate-500 mb-6">Rejoins Mura pour organiser tes projets</p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom d'utilisateur</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="toncompte"
                                required
                                minLength={3}
                                maxLength={50}
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Adresse email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="toi@exemple.com"
                                required
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1.5">Confirmer le mot de passe</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 h-9 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                        >
                            {loading ? 'Création…' : 'Créer mon compte'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-5">
                        Déjà un compte ?{' '}
                        <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
