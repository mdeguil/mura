import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ArchiveProjectDialog from '../components/ArchiveProjectDialog'
import ConfirmDialog from '../components/ConfirmDialog'
import CreateTaskModal from '../components/CreateTaskModal'
import EditProjectModal from '../components/EditProjectModal'
import ErrorMessage from '../components/ErrorMessage'
import LoadErrors from '../components/LoadErrors'
import PlanningPanel, { type PlanningView } from '../components/PlanningPanel'
import ProjectHeader from '../components/ProjectHeader'
import ProjectInfo from '../components/ProjectInfo'
import TaskBoard from '../components/TaskBoard'
import TaskDetailModal from '../components/TaskDetailModal'
import api from '../services/api'
import { useProject } from '../hooks/useProject'
import { useAuthStore } from '../store/authStore'
import type { Project, ProjectStatus, Subtask, Task, TaskStatus } from '../types'
import { apiErrorMessage } from '../utils/apiError'
import { taskPayload } from '../utils/taskPayload'

type ProjectTab = 'info' | 'planning' | 'tasks'

const TABS: { key: ProjectTab; label: string }[] = [
    { key: 'info', label: 'Infos' },
    { key: 'planning', label: 'Planning' },
    { key: 'tasks', label: 'Tâches' },
]

const DEFAULT_TAB: ProjectTab = 'info'

const byStartDate = (a: Task, b: Task) => a.startDate.localeCompare(b.startDate)

/**
 * A project's page, at /project/:id: its header, then the Infos, Planning
 * and Tâches tabs, the open one kept in the address. Someone only invited
 * gets the Infos tab, with the invitation to answer; the other two stay
 * locked.
 */
export default function ProjectPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const {
        project,
        setProject,
        loading,
        error,
        reloadProject,
        members,
        setMembers,
        tasks,
        setTasks,
        archivedTasks,
        setArchivedTasks,
        invitations,
        setInvitations,
        ownInvitation,
        loadErrors,
    } = useProject(id)

    const [actionError, setActionError] = useState('')
    const [showCreateTask, setShowCreateTask] = useState(false)
    const [editingProject, setEditingProject] = useState(false)
    const [archiving, setArchiving] = useState(false)
    const [deletingTask, setDeletingTask] = useState<Task | null>(null)
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
    const [planningView, setPlanningView] = useState<PlanningView>('calendar')
    const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null
    const currentUserId = useAuthStore((s) => s.user?.id) ?? ''
    const myRole = members.find((m) => m.id === currentUserId)?.role
    const isOwner = myRole === 'OWNER'
    const canManage = myRole === 'OWNER' || myRole === 'ADMIN'
    const invitedOnly = project?.access === 'INVITED'

    const tabParam = searchParams.get('tab')
    const activeTab: ProjectTab = invitedOnly
        ? 'info'
        : TABS.some((t) => t.key === tabParam)
          ? (tabParam as ProjectTab)
          : DEFAULT_TAB

    function selectTab(tab: ProjectTab) {
        setSearchParams(tab === DEFAULT_TAB ? {} : { tab }, { replace: true })
    }

    async function attempt(action: () => Promise<void>, fallback: string) {
        setActionError('')
        try {
            await action()
        } catch (err) {
            setActionError(apiErrorMessage(err, fallback))
        }
    }

    function handleAnswerInvitation(accepted: boolean) {
        if (!ownInvitation) return

        void attempt(async () => {
            await api.post(`/invitations/${ownInvitation.id}/${accepted ? 'accept' : 'decline'}`)
            if (!accepted) {
                navigate('/projets')
                return
            }
            reloadProject()
        }, accepted ? "Impossible d'accepter cette invitation." : 'Impossible de refuser cette invitation.')
    }

    function handleProjectStatusChange(status: ProjectStatus) {
        if (!project) return

        void attempt(async () => {
            const { data } = await api.put<Project>(`/projects/${id}`, {
                name: project.name,
                description: project.description,
                color: project.color,
                typeId: project.type.id,
                startDate: project.startDate ?? null,
                status,
            })
            setProject(data)
        }, 'Impossible de changer le statut du projet.')
    }

    function handleTaskCreated(task: Task) {
        setTasks((prev) => [...prev, task].sort(byStartDate))
    }

    async function handleStatusChange(taskId: string, status: TaskStatus) {
        setActionError('')
        const problem = await saveTask(taskId, { status }, 'Impossible de changer le statut de cette tâche.')
        if (problem) setActionError(problem)
    }

    function handleTaskSave(taskId: string, changes: { startDate: string; endDate: string; assigneeId: string | null }) {
        return saveTask(taskId, changes, "Impossible d'enregistrer cette tâche.")
    }

    async function saveTask(
        taskId: string,
        changes: { status?: TaskStatus; assigneeId?: string | null; startDate?: string; endDate?: string },
        fallbackMessage: string
    ): Promise<string | null> {
        const task = tasks.find((t) => t.id === taskId)
        if (!task) return null

        try {
            const { data } = await api.put<Task>(`/projects/${id}/tasks/${taskId}`, taskPayload(task, changes))
            setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)))
            return null
        } catch (err) {
            return apiErrorMessage(err, fallbackMessage)
        }
    }

    function updateTask(taskId: string, change: (task: Task) => Task) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? change(t) : t)))
    }

    function handleSubtaskAdded(taskId: string, subtask: Subtask) {
        updateTask(taskId, (t) => ({ ...t, subtasks: [...t.subtasks, subtask] }))
    }

    function handleSubtaskToggled(taskId: string, subtask: Subtask) {
        updateTask(taskId, (t) => ({ ...t, subtasks: t.subtasks.map((s) => (s.id === subtask.id ? subtask : s)) }))
    }

    function handleSubtaskDeleted(taskId: string, subtaskId: string) {
        updateTask(taskId, (t) => ({ ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) }))
    }

    function handleArchiveTask(taskId: string) {
        void attempt(async () => {
            const { data } = await api.patch<Task>(`/projects/${id}/tasks/${taskId}/archive`)
            setTasks((prev) => prev.filter((t) => t.id !== taskId))
            setArchivedTasks((prev) => [...prev, data])
        }, "Impossible d'archiver cette tâche.")
    }

    function handleRestoreTask(taskId: string) {
        void attempt(async () => {
            const { data } = await api.patch<Task>(`/projects/${id}/tasks/${taskId}/restore`)
            setArchivedTasks((prev) => prev.filter((t) => t.id !== taskId))
            setTasks((prev) => [...prev, data].sort(byStartDate))
        }, 'Impossible de restaurer cette tâche.')
    }

    function handleDeleteTaskPermanently(taskId: string) {
        setDeletingTask(archivedTasks.find((t) => t.id === taskId) ?? null)
    }

    async function deleteTask(task: Task) {
        await attempt(async () => {
            await api.delete(`/projects/${id}/tasks/${task.id}`)
            setArchivedTasks((prev) => prev.filter((t) => t.id !== task.id))
        }, 'Impossible de supprimer cette tâche.')
        setDeletingTask(null)
    }

    return (
        <div className="min-h-screen bg-app flex flex-col">
            <Navbar />

            <main className="flex-1 flex flex-col px-8 py-8 w-full">
                <Link to="/projets" className="text-sm text-slate-500 hover:text-slate-700 transition">
                    ← Mes projets
                </Link>

                {loading ? (
                    <div className="text-sm text-slate-500 mt-6">Chargement…</div>
                ) : !project ? (
                    <ErrorMessage onRetry={error ? reloadProject : undefined} className="mt-6">
                        {error || 'Projet introuvable.'}
                    </ErrorMessage>
                ) : (
                    <>
                        <ProjectHeader
                            project={project}
                            canManage={canManage}
                            isOwner={isOwner}
                            onStatusChange={handleProjectStatusChange}
                            onEdit={() => setEditingProject(true)}
                            onArchive={() => setArchiving(true)}
                        />

                        {actionError && <ErrorMessage className="mt-4">{actionError}</ErrorMessage>}
                        <LoadErrors failures={loadErrors} className="mt-4" />

                        <div className="mt-6 flex items-center gap-6 border-b border-border">
                            {TABS.map((tab) => {
                                const locked = invitedOnly && tab.key !== 'info'
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => !locked && selectTab(tab.key)}
                                        disabled={locked}
                                        title={locked ? "Accepte l'invitation pour accéder à cette vue" : undefined}
                                        className={`pb-3 -mb-px text-sm font-medium border-b-2 transition ${
                                            locked
                                                ? 'text-slate-300 border-transparent cursor-not-allowed'
                                                : activeTab === tab.key
                                                  ? 'text-slate-800 border-brand-500'
                                                  : 'text-slate-500 border-transparent hover:text-slate-700'
                                        }`}
                                    >
                                        {tab.label}
                                        {locked && ' 🔒'}
                                    </button>
                                )
                            })}
                        </div>

                        {activeTab === 'info' ? (
                            <div className="mt-6">
                                <ProjectInfo
                                    project={project}
                                    invitation={ownInvitation}
                                    onAnswerInvitation={handleAnswerInvitation}
                                    tasks={tasks}
                                    archivedCount={archivedTasks.length}
                                    members={members}
                                    invitations={invitations}
                                    canManage={canManage}
                                    isOwner={isOwner}
                                    currentUserId={currentUserId}
                                    onMembersChanged={setMembers}
                                    onInvited={(invitation) =>
                                        setInvitations((prev) => [
                                            ...prev.filter((i) => i.invitedUser.id !== invitation.invitedUser.id),
                                            invitation,
                                        ])
                                    }
                                    onInvitationCancelled={(invitationId) =>
                                        setInvitations((prev) => prev.filter((i) => i.id !== invitationId))
                                    }
                                    onMemberRemoved={(memberId) => {
                                        setMembers((prev) => prev.filter((m) => m.id !== memberId))
                                        setTasks((prev) =>
                                            prev.map((t) => (t.assignee?.id === memberId ? { ...t, assignee: null } : t))
                                        )
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="mt-6 flex-1 bg-surface border border-border rounded-2xl p-6 flex flex-col">
                                {activeTab === 'planning' ? (
                                    <PlanningPanel
                                        tasks={tasks}
                                        view={planningView}
                                        onViewChange={setPlanningView}
                                        onOpenTask={(task) => setSelectedTaskId(task.id)}
                                    />
                                ) : (
                                    <>
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-sm font-semibold text-slate-800">
                                                Tâches ({tasks.length})
                                            </h2>
                                            <button
                                                onClick={() => setShowCreateTask(true)}
                                                className="h-8 px-3 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-xs font-medium transition"
                                            >
                                                + Nouvelle tâche
                                            </button>
                                        </div>
                                        <TaskBoard
                                            tasks={tasks}
                                            archivedTasks={archivedTasks}
                                            onStatusChange={handleStatusChange}
                                            onArchive={handleArchiveTask}
                                            onRestore={handleRestoreTask}
                                            onDeletePermanently={handleDeleteTaskPermanently}
                                            onOpenTask={(task) => setSelectedTaskId(task.id)}
                                        />
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </main>

            {archiving && project && (
                <ArchiveProjectDialog
                    project={project}
                    onClose={() => setArchiving(false)}
                    onArchived={() => {
                        setArchiving(false)
                        navigate('/projets')
                    }}
                />
            )}
            {editingProject && project && (
                <EditProjectModal
                    project={project}
                    onClose={() => setEditingProject(false)}
                    onSaved={(updated) => setProject(updated)}
                />
            )}
            {showCreateTask && id && (
                <CreateTaskModal
                    projectId={id}
                    members={members}
                    onClose={() => setShowCreateTask(false)}
                    onCreated={handleTaskCreated}
                />
            )}
            {deletingTask && (
                <ConfirmDialog
                    title={`Supprimer définitivement « ${deletingTask.name} » ?`}
                    body="Elle ne pourra pas être récupérée. Cette action est irréversible."
                    confirmLabel="Supprimer définitivement"
                    icon="🗑️"
                    onCancel={() => setDeletingTask(null)}
                    onConfirm={() => deleteTask(deletingTask)}
                />
            )}

            {selectedTask && id && (
                <TaskDetailModal
                    task={selectedTask}
                    projectId={id}
                    members={members}
                    onSave={handleTaskSave}
                    onClose={() => setSelectedTaskId(null)}
                    onSubtaskAdded={handleSubtaskAdded}
                    onSubtaskToggled={handleSubtaskToggled}
                    onSubtaskDeleted={handleSubtaskDeleted}
                />
            )}
        </div>
    )
}
