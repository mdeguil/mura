import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import NotificationBell from './NotificationBell'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'

/**
 * The bar at the top of every signed-in page: the sections, the theme
 * switch, the bell, the account and signing out. Administration shows only
 * to administrators.
 *
 * It never makes the page wider than the screen. On a narrow one the
 * wordmark and the username step aside (the name stays for screen readers),
 * signing out becomes an icon, and if the sections still do not fit they
 * scroll inside the bar while the buttons on the right stay put.
 */
export default function Navbar() {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <header className="h-14 bg-surface border-b border-border flex items-center justify-between gap-2 px-3 sm:px-6">
            <div className="flex items-center gap-2.5 min-w-0">
                <Logo className="w-8 h-8 shrink-0" />
                <span className="hidden sm:inline text-lg font-semibold text-slate-800">Mura</span>

                <nav className="flex items-center gap-1 ml-1 sm:ml-4 min-w-0 overflow-x-auto [scrollbar-width:none]">
                    {[
                        { to: '/projets', label: 'Projets' },
                        { to: '/carnet', label: 'Carnet' },
                        ...(user?.accountRole === 'ADMIN'
                            ? [{ to: '/administration', label: 'Administration' }]
                            : []),
                    ].map((entry) => (
                        <NavLink
                            key={entry.to}
                            to={entry.to}
                            end
                            className={({ isActive }) =>
                                `shrink-0 whitespace-nowrap h-8 px-2 sm:px-3 rounded-lg flex items-center text-sm font-medium transition ${
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

            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <NotificationBell />
                </div>

                <NavLink
                    to="/compte"
                    title="Mon compte"
                    className={({ isActive }) =>
                        `flex items-center gap-2 h-8 pl-1 pr-1 md:pr-2.5 rounded-lg transition ${
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
                    <span className="sr-only md:not-sr-only text-sm text-slate-600">{user?.username}</span>
                    <span className="sr-only">, mon compte</span>
                </NavLink>
                <button
                    onClick={handleLogout}
                    title="Déconnexion"
                    className="flex items-center text-sm text-slate-500 hover:text-slate-700 border border-border-strong rounded-lg px-2 sm:px-3 py-1.5 transition"
                >
                    <svg
                        viewBox="0 0 24 24"
                        className="w-[18px] h-[18px] sm:hidden"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    <span className="sr-only sm:not-sr-only">Déconnexion</span>
                </button>
            </div>
        </header>
    )
}
