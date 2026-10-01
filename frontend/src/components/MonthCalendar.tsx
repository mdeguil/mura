import { useMemo, useState } from 'react'
import {
    addMonths,
    differenceInCalendarDays,
    eachDayOfInterval,
    endOfMonth,
    endOfWeek,
    format,
    isSameDay,
    isSameMonth,
    startOfDay,
    startOfMonth,
    startOfWeek,
    subMonths,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Task } from '../types'
import { TASK_STATUS_BAR_CLASSES, TASK_STATUS_LABELS, TASK_STATUSES } from '../utils/taskMeta'

const WEEK_OPTIONS = { weekStartsOn: 1 } as const

type Bar = {
    task: Task
    lane: number
    startCol: number
    span: number
    startsHere: boolean
    endsHere: boolean
}

// Lanes are assigned once for the whole month rather than per week, so a
// task spanning several weeks stays on the same line instead of hopping
// up and down as other tasks start and end around it.
function assignLanes(tasks: Task[]): Map<string, number> {
    const sorted = [...tasks].sort(
        (a, b) => a.startDate.localeCompare(b.startDate) || b.endDate.localeCompare(a.endDate)
    )

    const lanes = new Map<string, number>()
    const laneEnds: Date[] = []

    for (const task of sorted) {
        const start = startOfDay(new Date(task.startDate))
        const end = startOfDay(new Date(task.endDate))

        let lane = laneEnds.findIndex((occupiedUntil) => occupiedUntil < start)
        if (lane === -1) lane = laneEnds.length

        laneEnds[lane] = end
        lanes.set(task.id, lane)
    }

    return lanes
}

function barsForWeek(tasks: Task[], lanes: Map<string, number>, weekStart: Date, weekEnd: Date): Bar[] {
    return tasks
        .map((task) => {
            const start = startOfDay(new Date(task.startDate))
            const end = startOfDay(new Date(task.endDate))
            if (end < weekStart || start > weekEnd) return null

            const from = start < weekStart ? weekStart : start
            const to = end > weekEnd ? weekEnd : end

            return {
                task,
                lane: lanes.get(task.id) ?? 0,
                startCol: differenceInCalendarDays(from, weekStart),
                span: differenceInCalendarDays(to, from) + 1,
                startsHere: isSameDay(from, start),
                endsHere: isSameDay(to, end),
            }
        })
        .filter((bar): bar is Bar => bar !== null)
}

export default function MonthCalendar({
    tasks,
    onOpenTask,
}: {
    tasks: Task[]
    onOpenTask: (task: Task) => void
}) {
    // Open on the current month, unless nothing is planned there — then on
    // the month of the earliest task, so the calendar never opens empty.
    const [month, setMonth] = useState(() => {
        const thisMonth = startOfMonth(new Date())
        if (tasks.length === 0) return thisMonth

        const monthEnd = endOfMonth(thisMonth)
        const hasTaskThisMonth = tasks.some(
            (t) => startOfDay(new Date(t.startDate)) <= monthEnd && startOfDay(new Date(t.endDate)) >= thisMonth
        )
        if (hasTaskThisMonth) return thisMonth

        const earliest = tasks.reduce(
            (min, t) => (t.startDate < min ? t.startDate : min),
            tasks[0].startDate
        )
        return startOfMonth(new Date(earliest))
    })

    const lanes = useMemo(() => assignLanes(tasks), [tasks])

    const weeks = useMemo(() => {
        const days = eachDayOfInterval({
            start: startOfWeek(startOfMonth(month), WEEK_OPTIONS),
            end: endOfWeek(endOfMonth(month), WEEK_OPTIONS),
        })
        return Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7))
    }, [month])

    const today = startOfDay(new Date())

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setMonth((m) => subMonths(m, 1))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-surface-muted transition"
                        aria-label="Mois précédent"
                    >
                        ‹
                    </button>
                    <span className="text-sm font-semibold text-slate-800 capitalize min-w-[9rem] text-center">
                        {format(month, 'MMMM yyyy', { locale: fr })}
                    </span>
                    <button
                        onClick={() => setMonth((m) => addMonths(m, 1))}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:bg-surface-muted transition"
                        aria-label="Mois suivant"
                    >
                        ›
                    </button>
                    <button
                        onClick={() => setMonth(startOfMonth(new Date()))}
                        className="ml-2 h-7 px-2.5 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-brand-500 transition"
                    >
                        Aujourd'hui
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {TASK_STATUSES.map((status) => (
                        <div key={status} className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-sm ${TASK_STATUS_BAR_CLASSES[status]}`} />
                            <span className="text-xs text-slate-500">{TASK_STATUS_LABELS[status]}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden">
                <div className="grid grid-cols-7 bg-surface-muted">
                    {weeks[0].map((day) => (
                        <div
                            key={day.toISOString()}
                            className="px-2 py-1.5 text-xs font-medium text-slate-500 capitalize text-center"
                        >
                            {format(day, 'EEE', { locale: fr })}
                        </div>
                    ))}
                </div>

                {weeks.map((weekDays) => {
                    const bars = barsForWeek(tasks, lanes, weekDays[0], weekDays[6])

                    return (
                        <div key={weekDays[0].toISOString()} className="relative border-t border-border">
                            <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                                {weekDays.map((day) => (
                                    <div
                                        key={day.toISOString()}
                                        className={`border-l border-border first:border-l-0 ${
                                            day.getDay() === 0 || day.getDay() === 6 ? 'bg-surface-muted/50' : ''
                                        }`}
                                    />
                                ))}
                            </div>

                            <div className="relative">
                                <div className="grid grid-cols-7">
                                    {weekDays.map((day) => (
                                        <div key={day.toISOString()} className="px-2 pt-1.5 text-xs">
                                            <span
                                                className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
                                                    isSameDay(day, today)
                                                        ? 'bg-brand-500 text-white font-medium'
                                                        : isSameMonth(day, month)
                                                          ? 'text-slate-600'
                                                          : 'text-slate-300'
                                                }`}
                                            >
                                                {format(day, 'd')}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div
                                    className="grid grid-cols-7 gap-x-px gap-y-1 px-1 pt-1 pb-2 min-h-[2rem]"
                                    style={{ gridAutoRows: '1.25rem' }}
                                >
                                    {bars.map((bar) => (
                                        <button
                                            key={bar.task.id}
                                            onClick={() => onOpenTask(bar.task)}
                                            style={{
                                                gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
                                                gridRow: bar.lane + 1,
                                            }}
                                            title={`${bar.task.name} · ${TASK_STATUS_LABELS[bar.task.status]}`}
                                            className={`${TASK_STATUS_BAR_CLASSES[bar.task.status]} ${
                                                bar.startsHere ? 'rounded-l-md' : ''
                                            } ${
                                                bar.endsHere ? 'rounded-r-md' : ''
                                            } px-1.5 text-[11px] leading-5 text-white text-left truncate hover:opacity-90 transition`}
                                        >
                                            {bar.startsHere ? bar.task.name : `… ${bar.task.name}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {tasks.length === 0 && (
                <p className="text-sm text-slate-500 mt-4">Aucune tâche à planifier pour l'instant.</p>
            )}
        </div>
    )
}
