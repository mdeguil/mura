import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

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
        <div className="min-h-screen bg-[#f1efe8] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="bg-white border border-[#d3d1c7] rounded-2xl p-8 shadow-sm">

                    {/* Logo */}
                    <div className="flex items-center gap-2.5 mb-7">
                        <div className="w-8 h-8 rounded-xl bg-[#534AB7] flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">M</span>
                        </div>
                        <span className="text-xl font-semibold text-gray-900">Mura</span>
                    </div>

                    <h1 className="text-xl font-semibold text-gray-900 mb-1">Créer un compte ✨</h1>
                    <p className="text-sm text-gray-500 mb-6">Rejoins Mura pour organiser tes projets</p>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nom d'utilisateur</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="toncompte"
                                required
                                minLength={3}
                                maxLength={50}
                                className="w-full h-9 rounded-lg border border-[#b4b2a9] bg-[#f8f7f3] px-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#534AB7] transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Adresse email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="toi@exemple.com"
                                required
                                className="w-full h-9 rounded-lg border border-[#b4b2a9] bg-[#f8f7f3] px-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#534AB7] transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                className="w-full h-9 rounded-lg border border-[#b4b2a9] bg-[#f8f7f3] px-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#534AB7] transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Confirmer le mot de passe</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                minLength={8}
                                className="w-full h-9 rounded-lg border border-[#b4b2a9] bg-[#f8f7f3] px-3 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#534AB7] transition"
                            />
                        </div>

                        {error && (
                            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 h-9 rounded-lg bg-[#534AB7] hover:bg-[#3C3489] text-white text-sm font-medium transition disabled:opacity-60"
                        >
                            {loading ? 'Création…' : 'Créer mon compte'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-5">
                        Déjà un compte ?{' '}
                        <Link to="/login" className="text-[#534AB7] font-medium hover:text-[#3C3489]">
                            Se connecter
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
