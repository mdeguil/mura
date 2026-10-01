import { addMonths, format, startOfMonth, subMonths } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function MonthNav({ month, onChange }: { month: Date; onChange: (month: Date) => void }) {
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => onChange(subMonths(month, 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-surface-muted transition"
                aria-label="Mois précédent"
            >
                ‹
            </button>
            <span className="text-sm font-semibold text-slate-800 capitalize min-w-[9rem] text-center">
                {format(month, 'MMMM yyyy', { locale: fr })}
            </span>
            <button
                onClick={() => onChange(addMonths(month, 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-surface-muted transition"
                aria-label="Mois suivant"
            >
                ›
            </button>
            <button
                onClick={() => onChange(startOfMonth(new Date()))}
                className="ml-2 h-7 px-2.5 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-brand-500 transition"
            >
                Aujourd'hui
            </button>
        </div>
    )
}
