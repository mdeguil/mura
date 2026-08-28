import { useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import BoardCard from '../components/BoardCard'
import type { Board } from '../types'

export default function HomePage() {
    const [showComingSoon, setShowComingSoon] = useState(false)
    // TODO: replace with a real GET /api/boards call once the boards backend exists
    const [boards] = useState<Board[]>([])
    const [query, setQuery] = useState('')

    const filteredBoards = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return boards
        return boards.filter((b) => b.name.toLowerCase().includes(q))
    }, [boards, query])

    return (
        <div className="min-h-screen bg-app">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-800">Mes boards</h1>
                        <p className="text-sm text-slate-500 mt-1">Retrouve tous tes projets ici</p>
                    </div>
                    <button
                        onClick={() => setShowComingSoon(true)}
                        className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition"
                    >
                        + Créer un board
                    </button>
                </div>

                {showComingSoon && (
                    <div className="mb-6 text-sm text-brand-700 bg-brand-50 border border-brand-100 rounded-lg px-4 py-3 flex items-center justify-between">
                        <span>🚧 La création de boards arrive bientôt.</span>
                        <button
                            onClick={() => setShowComingSoon(false)}
                            className="text-brand-600 hover:text-brand-700 font-medium"
                        >
                            Fermer
                        </button>
                    </div>
                )}

                <div className="relative mb-6 max-w-sm">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Rechercher un board…"
                        className="w-full h-9 rounded-lg border border-border-strong bg-surface-muted pl-9 pr-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition"
                    />
                </div>

                {boards.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-brand-500 to-emerald-400 flex items-center justify-center mb-4">
                            <span className="text-white text-2xl">📋</span>
                        </div>
                        <h2 className="text-base font-semibold text-slate-800 mb-1">Aucun board pour l'instant</h2>
                        <p className="text-sm text-slate-500 max-w-sm">
                            Crée ton premier board pour commencer à organiser tes projets en listes et cartes.
                        </p>
                    </div>
                ) : filteredBoards.length === 0 ? (
                    <div className="bg-surface border border-border rounded-2xl py-16 px-6 flex flex-col items-center text-center">
                        <h2 className="text-base font-semibold text-slate-800 mb-1">Aucun résultat pour « {query} »</h2>
                        <p className="text-sm text-slate-500 max-w-sm">Essaie un autre nom de board.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {filteredBoards.map((board) => (
                            <BoardCard key={board.id} board={board} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
