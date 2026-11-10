import { useTranslation } from 'react-i18next'
import type { PasswordRule } from '../utils/passwordRules'

/**
 * How far a password is from meeting the rules: a bar, and each rule ticked
 * or not.
 *
 * @param props the rules, from passwordRules()
 */
export default function PasswordStrength({
    rules,
}: {
    /** The rules, each marked met or not. */
    rules: PasswordRule[]
}) {
    const { t } = useTranslation()
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

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 mt-2">
                {rules.map((rule) => (
                    <li
                        key={rule.key}
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
                        {t(`auth.rules.${rule.key}`)}
                    </li>
                ))}
            </ul>
        </div>
    )
}
