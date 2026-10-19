import type { Task, TaskStatus } from '../types'

type TaskChanges = {
    status?: TaskStatus
    assigneeId?: string | null
}

// The task endpoint takes a full representation, so every field has to be
// resent on any change. Building the body here keeps a status update from
// silently dropping the assignee (and the other way round).
export function taskPayload(task: Task, changes: TaskChanges = {}) {
    return {
        name: task.name,
        description: task.description,
        status: changes.status ?? task.status,
        startDate: task.startDate,
        endDate: task.endDate,
        assigneeId: changes.assigneeId !== undefined ? changes.assigneeId : (task.assignee?.id ?? null),
    }
}
