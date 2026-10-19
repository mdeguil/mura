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
    return (
        <div
            className={`${SIZES[size]} rounded-full bg-gradient-to-br from-blue-600 via-brand-500 to-emerald-400 flex items-center justify-center text-white font-semibold shrink-0`}
            title={title ?? user.username}
            aria-label={user.username}
        >
            {user.username[0]?.toUpperCase()}
        </div>
    )
}
