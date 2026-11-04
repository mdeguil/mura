import GanttChart from './GanttChart'
import MonthCalendar from './MonthCalendar'
import type { Task } from '../types'

export type PlanningView = 'calendar' | 'gantt'

const PLANNING_VIEWS: { key: PlanningView; label: string }[] = [
    { key: 'calendar', label: '📅 Calendrier' },
    { key: 'gantt', label: '📊 Gantt' },
]

// The same tasks laid out over time, as a month or as bars. The choice of
// view is the page's to keep, so it survives a trip to another tab.
export default function PlanningPanel({
    tasks,
    view,
    onViewChange,
    onOpenTask,
}: {
    tasks: Task[]
    view: PlanningView
    onViewChange: (view: PlanningView) => void
    onOpenTask: (task: Task) => void
}) {
    return (
        <>
            <div className="flex items-center gap-1 mb-4 self-start bg-surface-muted border border-border rounded-lg p-0.5">
                {PLANNING_VIEWS.map((entry) => (
                    <button
                        key={entry.key}
                        onClick={() => onViewChange(entry.key)}
                        aria-pressed={view === entry.key}
                        className={`h-7 px-3 rounded-md text-xs font-medium transition ${
                            view === entry.key
                                ? 'bg-surface text-slate-800 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {entry.label}
                    </button>
                ))}
            </div>

            {view === 'calendar' ? (
                <MonthCalendar tasks={tasks} onOpenTask={onOpenTask} />
            ) : (
                <GanttChart tasks={tasks} onOpenTask={onOpenTask} />
            )}
        </>
    )
}
