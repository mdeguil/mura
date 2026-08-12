import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import logo from '../assets/logo-icon.png'

export default function LoginPage() {
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
            navigate('/')
        } catch {
            setError('Email ou mot de passe incorrect.')
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

                    <h1 className="text-xl font-semibold text-slate-800 mb-1">Bon retour 👋</h1>
                    <p className="text-sm text-slate-500 mb-6">Connecte-toi à ton espace Mura</p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-medium text-slate-600">Mot de passe</label>
                                <a href="#" className="text-xs text-brand-600 hover:text-brand-700">Mot de passe oublié ?</a>
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
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
                            {loading ? 'Connexion…' : 'Se connecter'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-slate-500 mt-5">
                        Pas encore de compte ?{' '}
                        <Link to="/register" className="text-brand-600 font-medium hover:text-brand-700">
                            Créer un compte
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
