import type { Task, TaskStatus } from '../types'

type TaskChanges = {
    status?: TaskStatus
    assigneeId?: string | null
    startDate?: string
    endDate?: string
}

/**
 * The body of a task update. The task endpoint takes a full representation,
 * so every field has to be resent on any change. Building the body here
 * keeps a status update from silently dropping the assignee (and the other
 * way round).
 *
 * @param task the task as it stands
 * @param changes the fields to change; `assigneeId: null` unassigns, while
 *        leaving it out keeps the current assignee
 * @returns the full body for `PUT /projects/{id}/tasks/{taskId}`
 */
export function taskPayload(task: Task, changes: TaskChanges = {}) {
    return {
        name: task.name,
        description: task.description,
        status: changes.status ?? task.status,
        startDate: changes.startDate ?? task.startDate,
        endDate: changes.endDate ?? task.endDate,
        assigneeId: changes.assigneeId !== undefined ? changes.assigneeId : (task.assignee?.id ?? null),
    }
}
