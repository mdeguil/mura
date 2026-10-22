import type { User } from '../types'

const SIZES = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs',
} as const

export default function UserAvatar({
    user,
    size = 'md',
    title,
}: {
    user: User
    size?: keyof typeof SIZES
    title?: string
}) {
    const suspended = user.suspended === true

    return (
        <span className="relative inline-flex shrink-0">
            <span
                className={`${SIZES[size]} rounded-full flex items-center justify-center text-white font-semibold ${
                    // Drained of colour rather than hidden: the person is still
                    // on the team, they just cannot be reached.
                    suspended
                        ? 'bg-slate-300'
                        : 'bg-gradient-to-br from-blue-600 via-brand-500 to-emerald-400'
                }`}
                title={title ?? (suspended ? `${user.username} · compte suspendu` : user.username)}
                aria-label={suspended ? `${user.username}, compte suspendu` : user.username}
            >
                {user.username[0]?.toUpperCase()}
            </span>

            {suspended && (
                // A bar, not a cross: it reads at six pixels, where a cross
                // turns into a smudge.
                <span
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-surface flex items-center justify-center"
                    aria-hidden="true"
                >
                    <span className="block w-1.5 h-[1.5px] bg-white rounded-full" />
                </span>
            )}
        </span>
    )
}

// The word, for the places that have room for it. The avatar badge carries
// the same news where a pill would not fit.
export function SuspendedPill({ className = '' }: { className?: string }) {
    return (
        <span
            className={`shrink-0 text-[10px] font-medium rounded-full px-1.5 py-0.5 border border-red-200 bg-red-50 text-red-600 ${className}`}
        >
            Suspendu
        </span>
    )
}
