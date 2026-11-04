import { useCallback, type SetStateAction } from 'react'
import { useApiQuery } from './useApiQuery'
import type { Invitation, Member, Project, Task } from '../types'

/**
 * Everything the project page reads, and who may read what. A member gets
 * the tasks, the archived ones and the invitations sent; someone who only
 * holds an invitation gets the project's description and that invitation,
 * nothing more. The member-only requests wait until the project says which
 * of the two the reader is.
 */
export function useProject(id: string | undefined) {
    const projectQuery = useApiQuery<Project | null>(`/projects/${id}`, null, 'Impossible de charger ce projet.')
    const project = projectQuery.data
    const isMember = project?.access === 'MEMBER'
    const isInvited = project?.access === 'INVITED'

    const tasksQuery = useApiQuery<Task[]>(
        isMember ? `/projects/${id}/tasks` : null,
        [],
        'Impossible de charger les tâches.'
    )
    const archivedQuery = useApiQuery<Task[]>(
        isMember ? `/projects/${id}/tasks/archived` : null,
        [],
        'Impossible de charger les tâches archivées.'
    )
    // A plain member still sees who else has been invited, and only loses
    // the ability to cancel one.
    const invitationsQuery = useApiQuery<Invitation[]>(
        isMember ? `/projects/${id}/invitations` : null,
        [],
        'Impossible de charger les invitations du projet.'
    )
    // The invitation this page is asking the reader to answer.
    const ownInvitationsQuery = useApiQuery<Invitation[]>(
        isInvited ? '/invitations' : null,
        [],
        'Impossible de retrouver ton invitation.'
    )

    const { setData: setProject } = projectQuery
    // The team travels with the project, so there is one copy of it to keep
    // up to date rather than two that can disagree.
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

    // Each one that failed, with what asks it again.
    const loadErrors = [tasksQuery, archivedQuery, invitationsQuery, ownInvitationsQuery]
        .filter((query) => query.error)
        .map((query) => ({ message: query.error, retry: query.reload }))

    return {
        project,
        setProject,
        // Shown in place of the page only before the project first arrives:
        // reading it again after accepting an invitation keeps the page up.
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
