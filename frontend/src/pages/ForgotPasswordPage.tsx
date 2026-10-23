import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import logo from '../assets/logo-icon.png'

export default function ForgotPasswordPage() {
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
            setError(apiErrorMessage(err, "L'email n'a pas pu être envoyé."))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-app flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-7">
                        <img src={logo} alt="Mura" className="w-10 h-10 rounded-full" />
                        <span className="text-xl font-semibold text-slate-800">Mura</span>
                    </div>

                    {sent ? (
                        <>
                            <h1 className="text-xl font-semibold text-slate-800 mb-1">
                                Regarde tes mails 📬
                            </h1>
                            {/* Deliberately says "if": whether an address has an
                                account is not something this page will tell a
                                stranger, and the server answers the same either
                                way. */}
                            <p className="text-sm text-slate-500">
                                Si un compte Mura utilise{' '}
                                <span className="font-medium text-slate-700">{email.trim()}</span>, un
                                lien vient de partir. Il est valable 1 heure et ne sert qu'une fois.
                            </p>
                            <button
                                onClick={() => setSent(false)}
                                className="text-sm text-brand-600 font-medium hover:text-brand-700 mt-5"
                            >
                                Essayer une autre adresse
                            </button>
                        </>
                    ) : (
                        <>
                            <h1 className="text-xl font-semibold text-slate-800 mb-1">
                                Mot de passe oublié ?
                            </h1>
                            <p className="text-sm text-slate-500 mb-6">
                                Donne ton adresse, on t'envoie un lien pour en choisir un nouveau.
                            </p>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                <div>
                                    <label
                                        htmlFor="email"
                                        className="block text-xs font-medium text-slate-600 mb-1.5"
                                    >
                                        Adresse email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="toi@exemple.com"
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
                                    className="mt-1 h-10 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                                >
                                    {loading ? 'Envoi…' : 'Envoyer le lien'}
                                </button>
                            </form>
                        </>
                    )}

                    <p className="text-center text-sm text-slate-500 mt-5">
                        <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">
                            Revenir à la connexion
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
