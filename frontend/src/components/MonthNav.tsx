import { useTranslation } from 'react-i18next'
import { addMonths, format, startOfMonth, subMonths } from 'date-fns'
import { dateLocale } from '../utils/dates'

/**
 * The previous and next arrows of a planning view, around the month shown.
 *
 * @param props the month, how to move it, and what to call it
 */
export default function MonthNav({
    month,
    onChange,
    label,
}: {
    /** The month shown. */
    month: Date
    /**
     * Moves the month. Takes an updater rather than a value: clicking twice
     * before React re-renders would otherwise compute both steps from the
     * same month and only move one.
     */
    onChange: (update: (current: Date) => Date) => void
    /**
     * What to call the period. Defaults to the month itself; views spanning
     * several months pass their own range label here.
     */
    label?: string
}) {
    const { t } = useTranslation()
    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => onChange((current) => subMonths(current, 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-surface-muted transition"
                aria-label={t('planning.previousMonth')}
            >
                ‹
            </button>
            <span className="text-sm font-semibold text-slate-800 capitalize min-w-[9rem] text-center">
                {label ?? format(month, 'MMMM yyyy', { locale: dateLocale() })}
            </span>
            <button
                onClick={() => onChange((current) => addMonths(current, 1))}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-surface-muted transition"
                aria-label={t('planning.nextMonth')}
            >
                ›
            </button>
            <button
                onClick={() => onChange(() => startOfMonth(new Date()))}
                className="ml-2 h-7 px-2.5 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-brand-500 transition"
            >
                {t('planning.today')}
            </button>
        </div>
    )
}
