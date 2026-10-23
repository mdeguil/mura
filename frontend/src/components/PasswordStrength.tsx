// The rules the backend will apply, shown while the password is being typed.
// A rule you only learn about after submitting is a rule that reads as the
// form being broken.
export type PasswordRule = { label: string; met: boolean }

export function passwordRules(password: string, email: string, username: string): PasswordRule[] {
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedUser = username.trim().toLowerCase()
    const lower = password.toLowerCase()

    return [
        { label: 'Au moins 8 caractères', met: password.length >= 8 && password.length <= 72 },
        { label: 'Une majuscule', met: /\p{Lu}/u.test(password) },
        { label: 'Une minuscule', met: /\p{Ll}/u.test(password) },
        { label: 'Un chiffre', met: /\d/.test(password) },
        {
            label: 'Un caractère spécial',
            // Anything that is not a letter, a digit or a space. Spelling out
            // a list would refuse perfectly good characters nobody thought of.
            met: /[^\p{L}\p{N}\s]/u.test(password),
        },
        {
            label: "Différent de ton email et de ton nom d'utilisateur",
            // Unmet only once there is something to compare against, so the
            // list does not open on a red cross for an empty form.
            met:
                password.length > 0 &&
                (trimmedEmail.length === 0 || lower !== trimmedEmail) &&
                (trimmedUser.length === 0 || lower !== trimmedUser),
        },
    ]
}

export default function PasswordStrength({ rules }: { rules: PasswordRule[] }) {
    const met = rules.filter((r) => r.met).length
    const ratio = met / rules.length

    return (
        <div className="mt-2">
            <div className="h-1 rounded-full bg-surface-muted overflow-hidden" aria-hidden="true">
                <div
                    className={`h-full rounded-full transition-all duration-300 ${
                        ratio === 1 ? 'bg-emerald-500' : ratio > 0.6 ? 'bg-amber-400' : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.max(ratio * 100, 6)}%` }}
                />
            </div>

            {/* Two columns: six rules in a single stack pushes the submit
                button off a short screen. */}
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 mt-2">
                {rules.map((rule) => (
                    <li
                        key={rule.label}
                        className={`flex items-center gap-1.5 text-xs transition-colors ${
                            rule.met ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="w-3.5 h-3.5 shrink-0"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            {rule.met ? <path d="M20 6 9 17l-5-5" /> : <circle cx="12" cy="12" r="8" />}
                        </svg>
                        {rule.label}
                    </li>
                ))}
            </ul>
        </div>
    )
}
