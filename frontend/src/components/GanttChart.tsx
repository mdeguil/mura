import { useMemo } from 'react'
import { addDays, differenceInCalendarDays, format, isSameMonth, startOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Task } from '../types'
import { TASK_STATUS_BAR_CLASSES, TASK_STATUS_LABELS, TASK_STATUSES } from '../utils/taskMeta'

const DAY_WIDTH = 26
const LABEL_WIDTH = 180

// Crisp line plus a soft drop shadow on the right edge of the sticky name
// column, so it reads as a separate pane the timeline scrolls under. Done
// with a shadow rather than a border to keep the column exactly
// LABEL_WIDTH wide — a border would shift the bars off the month header.
const LABEL_SEPARATOR = '1px 0 0 0 rgb(203 213 225), 6px 0 8px -6px rgb(15 23 42 / 0.18)'

export default function GanttChart({ tasks }: { tasks: Task[] }) {
    const range = useMemo(() => {
        if (tasks.length === 0) return null
        const starts = tasks.map((t) => startOfDay(new Date(t.startDate)).getTime())
        const ends = tasks.map((t) => startOfDay(new Date(t.endDate)).getTime())
        const min = new Date(Math.min(...starts))
        const max = new Date(Math.max(...ends))
        return { min, max, days: differenceInCalendarDays(max, min) + 1 }
    }, [tasks])

    if (!range) {
        return <p className="text-sm text-slate-500">Aucune tâche à planifier pour l'instant.</p>
    }

    const months: { label: string; days: number }[] = []
    for (let i = 0; i < range.days; ) {
        const day = addDays(range.min, i)
        let span = 0
        while (i + span < range.days && isSameMonth(addDays(range.min, i + span), day)) span++
        months.push({ label: format(day, 'MMMM yyyy', { locale: fr }), days: span })
        i += span
    }

    const today = startOfDay(new Date())
    const todayOffset = differenceInCalendarDays(today, range.min)
    const showToday = todayOffset >= 0 && todayOffset < range.days

    return (
        <div>
            <div className="overflow-x-auto">
                <div style={{ width: range.days * DAY_WIDTH + LABEL_WIDTH }}>
                    <div className="flex">
                        <div
                            className="shrink-0 sticky left-0 bg-surface z-20"
                            style={{ width: LABEL_WIDTH, boxShadow: LABEL_SEPARATOR }}
                        />
                        {months.map((m, i) => (
                            <div
                                key={i}
                                style={{ width: m.days * DAY_WIDTH }}
                                className="text-xs font-medium text-slate-500 border-l border-border px-2 py-1 capitalize truncate"
                            >
                                {m.label}
                            </div>
                        ))}
                    </div>

                    <div className="relative">
                        {showToday && (
                            <div
                                className="absolute top-0 bottom-0 w-px bg-red-400 z-10"
                                style={{ left: LABEL_WIDTH + todayOffset * DAY_WIDTH }}
                            />
                        )}
                        {tasks.map((task) => {
                            const start = startOfDay(new Date(task.startDate))
                            const end = startOfDay(new Date(task.endDate))
                            const offset = differenceInCalendarDays(start, range.min)
                            const span = differenceInCalendarDays(end, start) + 1
                            return (
                                <div key={task.id} className="flex items-center h-10 border-t border-border">
                                    {/* h-full + leading-10 so the sticky background covers the whole
                                        row height: a shorter label would let the bars show through
                                        above and below the text when scrolled. */}
                                    <div
                                        className="shrink-0 sticky left-0 z-20 h-full bg-surface pr-3 text-sm leading-10 text-slate-700 truncate"
                                        style={{ width: LABEL_WIDTH, boxShadow: LABEL_SEPARATOR }}
                                        title={task.name}
                                    >
                                        {task.name}
                                    </div>
                                    <div className="relative flex-1 h-full">
                                        <div
                                            className={`absolute top-1.5 h-6 rounded-md ${TASK_STATUS_BAR_CLASSES[task.status]}`}
                                            style={{ left: offset * DAY_WIDTH, width: Math.max(span * DAY_WIDTH - 4, 8) }}
                                            title={`${task.name} (${TASK_STATUS_LABELS[task.status]})`}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 mt-3">
                {TASK_STATUSES.map((status) => (
                    <div key={status} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-sm ${TASK_STATUS_BAR_CLASSES[status]}`} />
                        <span className="text-xs text-slate-500">{TASK_STATUS_LABELS[status]}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
