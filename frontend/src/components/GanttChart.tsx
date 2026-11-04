import { useState } from 'react'
import {
    addDays,
    addMonths,
    differenceInCalendarDays,
    eachDayOfInterval,
    endOfMonth,
    format,
    getDaysInMonth,
    isSameDay,
    isSameMonth,
    isSameYear,
    startOfDay,
    startOfMonth,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import MonthNav from './MonthNav'
import type { Task } from '../types'
import { TASK_STATUS_BAR_CLASSES, TASK_STATUS_LABELS, TASK_STATUSES } from '../utils/taskMeta'
import { initialPlanningMonth } from '../utils/planning'

const LABEL_WIDTH = 180

// Crisp line plus a soft drop shadow on the right edge of the name column,
// so it reads as its own pane next to the timeline.
const LABEL_SEPARATOR = '1px 0 0 0 rgb(203 213 225), 6px 0 8px -6px rgb(15 23 42 / 0.18)'

/**
 * The tasks as bars over the days of a month, one row per task, with the
 * month to move through.
 *
 * @param props the tasks, and what to do when one is opened
 */
export default function GanttChart({
    tasks,
    onOpenTask,
}: {
    /** The tasks to lay out. */
    tasks: Task[]
    /** Called with the task whose bar or name was clicked. */
    onOpenTask: (task: Task) => void
}) {
    // A two-month window sliding one month at a time, so consecutive views
    // overlap and a task straddling a month break stays readable.
    const [month, setMonth] = useState(() => initialPlanningMonth(tasks))

    const secondMonth = addMonths(month, 1)
    const windowStart = startOfMonth(month)
    const windowEnd = endOfMonth(secondMonth)
    const dayCount = differenceInCalendarDays(windowEnd, windowStart) + 1

    // Two months always fit the available width, so positions are percentages
    // of the timeline rather than fixed pixels per day — no horizontal scroll.
    const percent = (days: number) => (days / dayCount) * 100

    const today = startOfDay(new Date())

    const monthSegments = [month, secondMonth].map((m) => ({
        date: m,
        offset: differenceInCalendarDays(startOfMonth(m), windowStart),
        days: getDaysInMonth(m),
        isCurrent: isSameMonth(m, today),
    }))

    const visibleTasks = tasks
        .filter(
            (t) =>
                startOfDay(new Date(t.startDate)) <= windowEnd &&
                startOfDay(new Date(t.endDate)) >= windowStart
        )
        .sort((a, b) => a.startDate.localeCompare(b.startDate))

    const weekOffsets = eachDayOfInterval({ start: windowStart, end: windowEnd })
        .filter((day) => day.getDay() === 1)
        .map((day) => differenceInCalendarDays(day, windowStart))
        .filter((offset) => offset > 0)

    // A Monday landing on a month label would collide with it, and one in the
    // last days of the window would overflow the right edge — both keep their
    // guide but lose their number.
    const labelledWeekOffsets = weekOffsets.filter(
        (offset) =>
            dayCount - offset > 2 &&
            monthSegments.every((segment) => Math.abs(offset - segment.offset) > 2)
    )

    const showToday = today >= windowStart && today <= windowEnd
    const todayOffset = differenceInCalendarDays(today, windowStart)

    const rangeLabel = isSameYear(month, secondMonth)
        ? `${format(month, 'MMMM', { locale: fr })} – ${format(secondMonth, 'MMMM yyyy', { locale: fr })}`
        : `${format(month, 'MMM yyyy', { locale: fr })} – ${format(secondMonth, 'MMM yyyy', { locale: fr })}`

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <MonthNav month={month} onChange={setMonth} label={rangeLabel} />

                <div className="flex items-center gap-4">
                    {TASK_STATUSES.map((status) => (
                        <div key={status} className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-sm ${TASK_STATUS_BAR_CLASSES[status]}`} />
                            <span className="text-xs text-slate-500">{TASK_STATUS_LABELS[status]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {visibleTasks.length === 0 ? (
                <p className="text-sm text-slate-500">Aucune tâche sur cette période.</p>
            ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                    <div className="flex bg-surface-muted">
                        <div className="shrink-0" style={{ width: LABEL_WIDTH, boxShadow: LABEL_SEPARATOR }} />
                        <div className="relative flex-1">
                            <div className="relative h-6 border-b border-border">
                                {monthSegments.map((segment) => (
                                    <span
                                        key={segment.offset}
                                        className={`absolute px-2 text-[11px] font-semibold leading-6 capitalize ${
                                            segment.isCurrent ? 'text-brand-700' : 'text-slate-600'
                                        }`}
                                        style={{ left: `${percent(segment.offset)}%` }}
                                    >
                                        {format(segment.date, 'MMMM yyyy', { locale: fr })}
                                    </span>
                                ))}
                            </div>
                            <div className="relative h-6">
                                {labelledWeekOffsets.map((offset) => (
                                    <span
                                        key={offset}
                                        className="absolute px-1.5 text-[11px] leading-6 text-slate-400"
                                        style={{ left: `${percent(offset)}%` }}
                                    >
                                        {format(addDays(windowStart, offset), 'd')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* isolate + negative z-index keeps the guides behind the rows,
                        so they don't paint over the horizontal separators. */}
                    <div className="relative isolate">
                        <div
                            className="absolute inset-y-0 pointer-events-none"
                            style={{ left: LABEL_WIDTH, right: 0, zIndex: -1 }}
                        >
                            {monthSegments
                                .filter((segment) => segment.isCurrent)
                                .map((segment) => (
                                    <div
                                        key={`current-${segment.offset}`}
                                        className="absolute top-0 bottom-0 bg-brand-50"
                                        style={{
                                            left: `${percent(segment.offset)}%`,
                                            width: `${percent(segment.days)}%`,
                                        }}
                                    />
                                ))}
                            {weekOffsets.map((offset) => (
                                <div
                                    key={offset}
                                    className="absolute top-0 bottom-0 w-px bg-border"
                                    style={{ left: `${percent(offset)}%` }}
                                />
                            ))}
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-slate-400"
                                style={{ left: `${percent(monthSegments[1].offset)}%` }}
                            />
                        </div>

                        {showToday && (
                            <div
                                className="absolute inset-y-0 pointer-events-none z-10"
                                style={{ left: LABEL_WIDTH, right: 0 }}
                            >
                                <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                                    style={{ left: `${percent(todayOffset)}%` }}
                                />
                            </div>
                        )}

                        {visibleTasks.map((task) => {
                            const start = startOfDay(new Date(task.startDate))
                            const end = startOfDay(new Date(task.endDate))
                            const from = start < windowStart ? windowStart : start
                            const to = end > windowEnd ? windowEnd : end
                            const offset = differenceInCalendarDays(from, windowStart)
                            const span = differenceInCalendarDays(to, from) + 1

                            return (
                                <div key={task.id} className="flex items-center h-10 border-t border-border">
                                    <div
                                        className="shrink-0 h-full bg-surface pr-3 text-sm leading-10 text-slate-700 truncate"
                                        style={{ width: LABEL_WIDTH, boxShadow: LABEL_SEPARATOR }}
                                        title={task.name}
                                    >
                                        {task.name}
                                    </div>
                                    <div className="relative flex-1 h-full">
                                        {/* Square edges where the task runs past the window. */}
                                        <button
                                            onClick={() => onOpenTask(task)}
                                            className={`absolute top-1.5 h-6 transition hover:opacity-90 ${
                                                TASK_STATUS_BAR_CLASSES[task.status]
                                            } ${isSameDay(from, start) ? 'rounded-l-md' : ''} ${
                                                isSameDay(to, end) ? 'rounded-r-md' : ''
                                            }`}
                                            style={{
                                                left: `${percent(offset)}%`,
                                                width: `${percent(span)}%`,
                                                minWidth: 6,
                                            }}
                                            title={`${task.name} · ${TASK_STATUS_LABELS[task.status]}`}
                                            aria-label={task.name}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
