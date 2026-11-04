import type { User } from '../types'

const SIZES = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs',
} as const

/**
 * A person's initial in a coloured disc, greyed out and badged when their
 * account is suspended.
 *
 * @param props the person, the size and the tooltip
 */
export default function UserAvatar({
    user,
    size = 'md',
    title,
}: {
    /** The person shown. */
    user: User
    /** How big the disc is, `md` by default. */
    size?: keyof typeof SIZES
    /** The tooltip; the name, and the suspension if any, by default. */
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
                        : 'bg-brand-gradient-diagonal'
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

/**
 * The "Suspendu" pill, for the places that have room for the word. The
 * avatar badge carries the same news where a pill would not fit.
 *
 * @param props extra classes for the pill
 */
export function SuspendedPill({ className = '' }: {
    /** Classes added to the pill's own. */
    className?: string
}) {
    return (
        <span
            className={`shrink-0 text-[10px] font-medium rounded-full px-1.5 py-0.5 border border-red-200 bg-red-50 text-red-600 ${className}`}
        >
            Suspendu
        </span>
    )
}
