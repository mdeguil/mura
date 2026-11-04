import { endOfMonth, startOfDay, startOfMonth } from 'date-fns'
import type { Task } from '../types'

/**
 * The month a planning view opens on: the current one, unless nothing is
 * planned there -- then the month of the earliest task, so a planning view
 * never opens empty.
 *
 * @param tasks the tasks shown
 * @returns the first day of that month
 */
export function initialPlanningMonth(tasks: Task[]): Date {
    const thisMonth = startOfMonth(new Date())
    if (tasks.length === 0) return thisMonth

    const monthEnd = endOfMonth(thisMonth)
    const hasTaskThisMonth = tasks.some(
        (t) => startOfDay(new Date(t.startDate)) <= monthEnd && startOfDay(new Date(t.endDate)) >= thisMonth
    )
    if (hasTaskThisMonth) return thisMonth

    const earliest = tasks.reduce((min, t) => (t.startDate < min ? t.startDate : min), tasks[0].startDate)
    return startOfMonth(new Date(earliest))
}
