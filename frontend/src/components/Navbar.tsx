import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import logo from '../assets/logo-icon.png'

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
                <img src={logo} alt="Mura" className="w-8 h-8 rounded-full" />
                <span className="text-lg font-semibold text-slate-800">Mura</span>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 via-brand-500 to-emerald-400 flex items-center justify-center text-white text-xs font-semibold">
                        {user?.username?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <span className="text-sm text-slate-600">{user?.username}</span>
                </div>
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
