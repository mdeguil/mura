import { useState } from 'react'

// A password field whose content can be read back. Typing eleven invisible
// characters twice and being told they disagree is the usual way a signup
// fails for no good reason.
export default function PasswordInput({
    value,
    onChange,
    placeholder = '••••••••',
    invalid = false,
    autoComplete,
    id,
}: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    invalid?: boolean
    autoComplete?: string
    id?: string
}) {
    const [shown, setShown] = useState(false)

    return (
        <div className="relative">
            <input
                id={id}
                type={shown ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                required
                className={`w-full h-10 rounded-lg border bg-surface-muted pl-3 pr-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition ${
                    invalid
                        ? 'border-red-300 focus:border-red-400'
                        : 'border-border-strong focus:border-brand-500'
                }`}
            />
            <button
                type="button"
                onClick={() => setShown((v) => !v)}
                // tabIndex -1: tabbing from the password field should reach the
                // next field, not this toggle.
                tabIndex={-1}
                aria-label={shown ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
            >
                <svg
                    viewBox="0 0 24 24"
                    className="w-[18px] h-[18px]"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                >
                    {shown ? (
                        <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-8-10-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                            <path d="m2 2 20 20" />
                        </>
                    ) : (
                        <>
                            <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8Z" />
                            <circle cx="12" cy="12" r="3" />
                        </>
                    )}
                </svg>
            </button>
        </div>
    )
}
