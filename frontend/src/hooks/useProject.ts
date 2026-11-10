import i18n from '../i18n'
import { useCallback, type SetStateAction } from 'react'
import { useApiQuery } from './useApiQuery'
import type { Invitation, Member, Project, Task } from '../types'

/**
 * Everything the project page reads, and who may read what. A member gets
 * the tasks, the archived ones and the invitations sent; someone who only
 * holds an invitation gets the project's description and that invitation,
 * nothing more. The member-only requests wait until the project says which
 * of the two the reader is.
 *
 * @param id the project's id, from the address
 * @returns the project and its team, tasks, archived tasks and
 *          invitations, each with its setter; the reader's own invitation
 *          when they are only invited; and the load errors with how to retry
 */
export function useProject(id: string | undefined) {
    const projectQuery = useApiQuery<Project | null>(`/projects/${id}`, null, i18n.t('projects.load.project'))
    const project = projectQuery.data
    const isMember = project?.access === 'MEMBER'
    const isInvited = project?.access === 'INVITED'

    const tasksQuery = useApiQuery<Task[]>(
        isMember ? `/projects/${id}/tasks` : null,
        [],
        i18n.t('projects.load.tasks')
    )
    const archivedQuery = useApiQuery<Task[]>(
        isMember ? `/projects/${id}/tasks/archived` : null,
        [],
        i18n.t('projects.load.archivedTasks')
    )
    const invitationsQuery = useApiQuery<Invitation[]>(
        isMember ? `/projects/${id}/invitations` : null,
        [],
        i18n.t('projects.load.invitations')
    )
    const ownInvitationsQuery = useApiQuery<Invitation[]>(
        isInvited ? '/invitations' : null,
        [],
        i18n.t('projects.load.ownInvitation')
    )

    const { setData: setProject } = projectQuery
    const setMembers = useCallback(
        (next: SetStateAction<Member[]>) =>
            setProject((current) =>
                current && {
                    ...current,
                    members: typeof next === 'function' ? next(current.members) : next,
                }
            ),
        [setProject]
    )

    const loadErrors = [tasksQuery, archivedQuery, invitationsQuery, ownInvitationsQuery]
        .filter((query) => query.error)
        .map((query) => ({ message: query.error, retry: query.reload }))

    return {
        project,
        setProject,
        loading: projectQuery.loading && !project,
        error: projectQuery.error,
        reloadProject: projectQuery.reload,
        members: project?.members ?? [],
        setMembers,
        tasks: tasksQuery.data,
        setTasks: tasksQuery.setData,
        archivedTasks: archivedQuery.data,
        setArchivedTasks: archivedQuery.setData,
        invitations: invitationsQuery.data,
        setInvitations: invitationsQuery.setData,
        ownInvitation: isInvited ? (ownInvitationsQuery.data.find((i) => i.projectId === id) ?? null) : null,
        loadErrors,
    }
}
