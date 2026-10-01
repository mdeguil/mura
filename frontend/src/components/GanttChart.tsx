import { useState } from 'react'
import {
    addDays,
    differenceInCalendarDays,
    eachDayOfInterval,
    endOfMonth,
    format,
    getDaysInMonth,
    isSameDay,
    isSameMonth,
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

export default function GanttChart({
    tasks,
    onOpenTask,
}: {
    tasks: Task[]
    onOpenTask: (task: Task) => void
}) {
    const [month, setMonth] = useState(() => initialPlanningMonth(tasks))

    const monthStart = startOfMonth(month)
    const monthEnd = endOfMonth(month)
    const dayCount = getDaysInMonth(month)

    // One month always fits the available width, so positions are percentages
    // of the timeline rather than fixed pixels per day — no horizontal scroll.
    const percent = (days: number) => (days / dayCount) * 100

    const visibleTasks = tasks
        .filter(
            (t) =>
                startOfDay(new Date(t.startDate)) <= monthEnd && startOfDay(new Date(t.endDate)) >= monthStart
        )
        .sort((a, b) => a.startDate.localeCompare(b.startDate))

    const weekOffsets = eachDayOfInterval({ start: monthStart, end: monthEnd })
        .filter((day) => day.getDay() === 1)
        .map((day) => differenceInCalendarDays(day, monthStart))
        .filter((offset) => offset > 0)

    const today = startOfDay(new Date())
    const showToday = isSameMonth(today, month)
    const todayOffset = differenceInCalendarDays(today, monthStart)

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <MonthNav month={month} onChange={setMonth} />

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
                <p className="text-sm text-slate-500">Aucune tâche sur ce mois.</p>
            ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                    <div className="flex bg-surface-muted">
                        <div className="shrink-0" style={{ width: LABEL_WIDTH, boxShadow: LABEL_SEPARATOR }} />
                        <div className="relative flex-1 h-7">
                            <span className="absolute left-0 px-1.5 text-[11px] leading-7 text-slate-500">
                                {format(monthStart, 'd MMM', { locale: fr })}
                            </span>
                            {/* A Monday falling on the 2nd or 3rd would collide with the
                                month-start label, so it keeps its guide but loses its number. */}
                            {weekOffsets
                                .filter((offset) => offset > 2)
                                .map((offset) => (
                                    <span
                                        key={offset}
                                        className="absolute px-1.5 text-[11px] leading-7 text-slate-500"
                                        style={{ left: `${percent(offset)}%` }}
                                    >
                                        {format(addDays(monthStart, offset), 'd')}
                                    </span>
                                ))}
                        </div>
                    </div>

                    {/* isolate + negative z-index keeps the guides behind the rows,
                        so they don't paint over the horizontal separators. */}
                    <div className="relative isolate">
                        <div
                            className="absolute inset-y-0 pointer-events-none"
                            style={{ left: LABEL_WIDTH, right: 0, zIndex: -1 }}
                        >
                            {weekOffsets.map((offset) => (
                                <div
                                    key={offset}
                                    className="absolute top-0 bottom-0 w-px bg-border"
                                    style={{ left: `${percent(offset)}%` }}
                                />
                            ))}
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
                            const from = start < monthStart ? monthStart : start
                            const to = end > monthEnd ? monthEnd : end
                            const offset = differenceInCalendarDays(from, monthStart)
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
                                        {/* Square edges where the task runs past this month. */}
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
