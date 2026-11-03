import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import NotificationBell from './NotificationBell'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'

export default function Navbar() {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6">
            <div className="flex items-center gap-2.5">
                <Logo className="w-8 h-8" />
                <span className="text-lg font-semibold text-slate-800">Mura</span>

                {/* The halves of the app sit beside the mark, so the carnet
                    is as reachable as the projects from anywhere. */}
                <nav className="flex items-center gap-1 ml-4">
                    {[
                        { to: '/projets', label: 'Projets' },
                        { to: '/carnet', label: 'Carnet' },
                        // Only for an administrator, and only as a
                        // convenience: the server refuses every call this
                        // page makes to anyone else.
                        ...(user?.accountRole === 'ADMIN'
                            ? [{ to: '/administration', label: 'Administration' }]
                            : []),
                    ].map((entry) => (
                        <NavLink
                            key={entry.to}
                            to={entry.to}
                            end
                            className={({ isActive }) =>
                                `h-8 px-3 rounded-lg flex items-center text-sm font-medium transition ${
                                    isActive
                                        ? 'bg-surface-muted text-slate-800'
                                        : 'text-slate-500 hover:text-slate-700'
                                }`
                            }
                        >
                            {entry.label}
                        </NavLink>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <NotificationBell />
                </div>

                {/* The way to one's own account: what Mura holds, a copy of
                    it, and closing the account. */}
                <NavLink
                    to="/compte"
                    title="Mon compte"
                    className={({ isActive }) =>
                        `flex items-center gap-2 h-8 pl-1 pr-2.5 rounded-lg transition ${
                            isActive ? 'bg-surface-muted' : 'hover:bg-surface-muted'
                        }`
                    }
                >
                    <div
                        className="w-7 h-7 rounded-full bg-brand-gradient-diagonal flex items-center justify-center text-white text-xs font-semibold"
                        aria-hidden="true"
                    >
                        {user?.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm text-slate-600">{user?.username}</span>
                    <span className="sr-only">, mon compte</span>
                </NavLink>
                <button
                    onClick={handleLogout}
                    className="text-sm text-slate-500 hover:text-slate-700 border border-border-strong rounded-lg px-3 py-1.5 transition"
                >
                    Déconnexion
                </button>
            </div>
        </header>
    )
}
