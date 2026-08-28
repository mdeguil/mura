import { Link } from 'react-router-dom'
import type { Board } from '../types'

export default function BoardCard({ board }: { board: Board }) {
    return (
        <Link
            to={`/board/${board.id}`}
            className="block bg-surface border border-border rounded-xl p-4 hover:border-brand-500 transition"
        >
            <div className="w-full h-16 rounded-lg mb-3" style={{ backgroundColor: board.color }} />
            <h3 className="text-sm font-semibold text-slate-800 truncate">{board.name}</h3>
            {board.description && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{board.description}</p>
            )}
        </Link>
    )
}
