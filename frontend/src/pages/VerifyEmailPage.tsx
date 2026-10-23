import React, { useEffect, useRef, useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/apiError'
import { useAuthStore } from '../store/authStore'
import type { Account } from '../types'
import logo from '../assets/logo-icon.png'

const LENGTH = 6

// The only thing a freshly registered account can do. Nothing else is worth
// showing until the address is confirmed, so this is not a page you navigate
// to -- it is what the app is until the code comes back.
export default function VerifyEmailPage() {
    const user = useAuthStore((s) => s.user)
    const setUser = useAuthStore((s) => s.setUser)
    const logout = useAuthStore((s) => s.logout)

    const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''))
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const boxes = useRef<(HTMLInputElement | null)[]>([])

    useEffect(() => {
        boxes.current[0]?.focus()
    }, [])

    const code = digits.join('')

    function put(index: number, value: string) {
        // Pasting the whole code into any box should fill them all, which is
        // what people actually do with a code they just copied.
        const typed = value.replace(/\D/g, '')
        if (typed.length === 0) {
            setDigits((prev) => prev.map((d, i) => (i === index ? '' : d)))
            return
        }

        setError('')
        setDigits((prev) => {
            const next = [...prev]
            for (let i = 0; i < typed.length && index + i < LENGTH; i++) {
                next[index + i] = typed[i]
            }
            return next
        })
        boxes.current[Math.min(index + typed.length, LENGTH - 1)]?.focus()
    }

    function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
        // Backspace on an empty box steps back, rather than doing nothing and
        // leaving the caret stranded.
        if (event.key === 'Backspace' && digits[index] === '' && index > 0) {
            event.preventDefault()
            boxes.current[index - 1]?.focus()
            setDigits((prev) => prev.map((d, i) => (i === index - 1 ? '' : d)))
        }
        if (event.key === 'ArrowLeft' && index > 0) boxes.current[index - 1]?.focus()
        if (event.key === 'ArrowRight' && index < LENGTH - 1) boxes.current[index + 1]?.focus()
    }

    async function submit(e?: React.FormEvent) {
        e?.preventDefault()
        if (code.length !== LENGTH) {
            setError('Entre les 6 chiffres du code.')
            return
        }

        setError('')
        setNotice('')
        setLoading(true)
        try {
            const { data } = await api.post<Account>('/auth/verify', { code })
            // The rest of the app appears the moment this lands.
            setUser(data)
        } catch (err) {
            setError(apiErrorMessage(err, "Ce code n'a pas été accepté."))
            setDigits(Array(LENGTH).fill(''))
            boxes.current[0]?.focus()
        } finally {
            setLoading(false)
        }
    }

    async function resend() {
        setError('')
        setNotice('')
        setResending(true)
        try {
            await api.post('/auth/verify/resend')
            setNotice('Un nouveau code vient de partir. Le précédent ne marche plus.')
        } catch (err) {
            setError(apiErrorMessage(err, "Le code n'a pas pu être renvoyé."))
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="min-h-screen bg-app flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-7">
                        <img src={logo} alt="Mura" className="w-10 h-10 rounded-full" />
                        <span className="text-xl font-semibold text-slate-800">Mura</span>
                    </div>

                    <h1 className="text-xl font-semibold text-slate-800 mb-1">Confirme ton adresse 📬</h1>
                    <p className="text-sm text-slate-500 mb-6">
                        On vient d'envoyer un code à 6 chiffres à{' '}
                        <span className="font-medium text-slate-700">{user?.email}</span>. Il est
                        valable 15 minutes.
                    </p>

                    <form onSubmit={submit}>
                        <div className="flex gap-2 justify-between">
                            {digits.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => {
                                        boxes.current[index] = el
                                    }}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={LENGTH}
                                    value={digit}
                                    onChange={(e) => put(index, e.target.value)}
                                    onKeyDown={(e) => onKeyDown(index, e)}
                                    aria-label={`Chiffre ${index + 1}`}
                                    className={`w-full h-14 rounded-xl border text-center text-xl font-semibold text-slate-800 bg-surface-muted outline-none transition ${
                                        error
                                            ? 'border-red-300 focus:border-red-400'
                                            : 'border-border-strong focus:border-brand-500'
                                    }`}
                                />
                            ))}
                        </div>

                        {error && <p className="text-xs text-red-500 mt-3">{error}</p>}
                        {notice && <p className="text-xs text-emerald-600 mt-3">{notice}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-5 h-10 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                        >
                            {loading ? 'Vérification…' : 'Confirmer'}
                        </button>
                    </form>

                    <div className="flex items-center justify-between mt-5 text-sm">
                        <button
                            onClick={resend}
                            disabled={resending}
                            className="text-brand-600 font-medium hover:text-brand-700 transition disabled:opacity-60"
                        >
                            {resending ? 'Envoi…' : 'Renvoyer le code'}
                        </button>
                        <button
                            onClick={logout}
                            className="text-slate-400 hover:text-slate-600 transition"
                        >
                            Se déconnecter
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-400 mt-4">
                    Rien reçu ? Regarde dans les indésirables, ou renvoie le code.
                </p>
            </div>
        </div>
    )
}
