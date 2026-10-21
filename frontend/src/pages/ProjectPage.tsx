import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import CreateTaskModal from '../components/CreateTaskModal'
import GanttChart from '../components/GanttChart'
import MonthCalendar from '../components/MonthCalendar'
import TaskBoard from '../components/TaskBoard'
import TaskDetailModal from '../components/TaskDetailModal'
import ProjectInfo from '../components/ProjectInfo'
import EditProjectModal from '../components/EditProjectModal'
import ProjectStatusPicker from '../components/ProjectStatusPicker'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'
import type { Invitation, Member, Project, ProjectStatus, Subtask, Task, TaskStatus } from '../types'
import { PROJECT_TYPE_LABELS } from '../utils/projectMeta'
import { projectGlassBackground } from '../utils/color'
import { taskPayload } from '../utils/taskPayload'
import { apiErrorMessage } from '../utils/apiError'

type ProjectTab = 'info' | 'planning' | 'tasks'

const TABS: { key: ProjectTab; label: string }[] = [
    { key: 'info', label: 'Infos' },
    { key: 'planning', label: 'Planning' },
    { key: 'tasks', label: 'Tâches' },
]

const DEFAULT_TAB: ProjectTab = 'info'

type PlanningView = 'calendar' | 'gantt'

const PLANNING_VIEWS: { key: PlanningView; label: string }[] = [
    { key: 'calendar', label: '📅 Calendrier' },
    { key: 'gantt', label: '📊 Gantt' },
]

export default function ProjectPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()
    const [project, setProject] = useState<Project | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [invitations, setInvitations] = useState<Invitation[]>([])
    const [ownInvitation, setOwnInvitation] = useState<Invitation | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [tasks, setTasks] = useState<Task[]>([])
    const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
    const [showCreateTask, setShowCreateTask] = useState(false)
    const [editingProject, setEditingProject] = useState(false)
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
    const [planningView, setPlanningView] = useState<PlanningView>('calendar')
    const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null
    const currentUserId = useAuthStore((s) => s.user?.id) ?? ''
    // Rights come from the membership row, not from owning the project: an
    // admin manages the team too.
    const myRole = members.find((m) => m.id === currentUserId)?.role
    const isOwner = myRole === 'OWNER'
    const canManage = myRole === 'OWNER' || myRole === 'ADMIN'
    // Holding an invitation buys a look at the project, not a seat on it:
    // the other tabs stay shut until it is accepted.
    const invitedOnly = project?.access === 'INVITED'

    // The active tab lives in the URL (?tab=…) so a refresh — or a shared
    // link — lands back on the same view instead of resetting to Infos.
    const tabParam = searchParams.get('tab')
    const activeTab: ProjectTab = invitedOnly
        ? 'info'
        : TABS.some((t) => t.key === tabParam)
          ? (tabParam as ProjectTab)
          : DEFAULT_TAB

    function selectTab(tab: ProjectTab) {
        setSearchParams(tab === DEFAULT_TAB ? {} : { tab }, { replace: true })
    }

    useEffect(() => {
        let cancelled = false

        api.get<Project>(`/projects/${id}`)
            .then(({ data }) => {
                if (cancelled) return
                setProject(data)
                setMembers(data.members)
            })
            .catch((err) => {
                if (!cancelled) setError(apiErrorMessage(err, 'Impossible de charger ce projet.'))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [id])

    // Everything below is members-only. Someone who merely holds an
    // invitation gets the project's description and nothing else, so these
    // wait until the project says which of the two the caller is.
    useEffect(() => {
        if (project?.access !== 'MEMBER') return
        let cancelled = false

        api.get<Task[]>(`/projects/${id}/tasks`)
            .then(({ data }) => {
                if (!cancelled) setTasks(data)
            })
            .catch(() => {})

        api.get<Task[]>(`/projects/${id}/tasks/archived`)
            .then(({ data }) => {
                if (!cancelled) setArchivedTasks(data)
            })
            .catch(() => {})

        // A plain member still sees who else has been invited, and only
        // loses the ability to cancel one.
        api.get<Invitation[]>(`/projects/${id}/invitations`)
            .then(({ data }) => {
                if (!cancelled) setInvitations(data)
            })
            .catch(() => {})

        return () => {
            cancelled = true
        }
    }, [id, project?.access])

    // The invitation this page is asking the viewer to answer.
    useEffect(() => {
        if (project?.access !== 'INVITED') return
        let cancelled = false

        api.get<Invitation[]>('/invitations')
            .then(({ data }) => {
                if (!cancelled) setOwnInvitation(data.find((i) => i.projectId === id) ?? null)
            })
            .catch(() => {})

        return () => {
            cancelled = true
        }
    }, [id, project?.access])


    async function handleAnswerInvitation(accepted: boolean) {
        if (!ownInvitation) return

        await api.post(`/invitations/${ownInvitation.id}/${accepted ? 'accept' : 'decline'}`)
        setOwnInvitation(null)

        if (!accepted) {
            navigate('/')
            return
        }

        // Accepting changes what the server will hand back, so the project is
        // read again — this time as a member, with the team and the tasks.
        const { data } = await api.get<Project>(`/projects/${id}`)
        setProject(data)
        setMembers(data.members)
    }



    // Same endpoint the edit dialog uses: it replaces the whole project, so
    // the untouched fields are resent alongside the new status.
    async function handleProjectStatusChange(status: ProjectStatus) {
        if (!project) return

        try {
            const { data } = await api.put<Project>(`/projects/${id}`, {
                name: project.name,
                description: project.description,
                color: project.color,
                type: project.type,
                startDate: project.startDate ?? null,
                status,
            })
            setProject(data)
        } catch (err) {
            window.alert(apiErrorMessage(err, 'Impossible de changer le statut du projet.'))
        }
    }
    async function handleArchiveProject() {
        if (
            !window.confirm(
                `Archiver « ${project?.name} » ? Il quittera la liste de toute l’équipe. Tu pourras le restaurer, ou le supprimer définitivement, depuis les projets archivés.`
            )
        ) {
            return
        }

        try {
            await api.patch(`/projects/${id}/archive`)
            // It just left everyone's list, this page included.
            navigate('/')
        } catch (err) {
            window.alert(apiErrorMessage(err, 'Impossible d’archiver ce projet.'))
        }
    }
    function handleTaskCreated(task: Task) {
        setTasks((prev) => [...prev, task].sort((a, b) => a.startDate.localeCompare(b.startDate)))
    }

    function handleStatusChange(taskId: string, status: TaskStatus) {
        void saveTask(taskId, { status }, "Impossible de changer le statut de cette tâche.")
    }

    function handleAssigneeChange(taskId: string, assigneeId: string | null) {
        void saveTask(taskId, { assigneeId }, "Impossible de changer le responsable de cette tâche.")
    }

    // Both edits go through the same PUT, which replaces the whole task:
    // taskPayload resends the fields this change does not touch.
    async function saveTask(
        taskId: string,
        changes: { status?: TaskStatus; assigneeId?: string | null },
        fallbackMessage: string
    ) {
        const task = tasks.find((t) => t.id === taskId)
        if (!task) return

        try {
            const { data } = await api.put<Task>(
                `/projects/${id}/tasks/${taskId}`,
                taskPayload(task, changes)
            )
            setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)))
        } catch (err) {
            window.alert(apiErrorMessage(err, fallbackMessage))
        }
    }

    function handleSubtaskAdded(taskId: string, subtask: Subtask) {
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, subtask] } : t))
        )
    }

    function handleSubtaskToggled(taskId: string, subtask: Subtask) {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === taskId
                    ? { ...t, subtasks: t.subtasks.map((s) => (s.id === subtask.id ? subtask : s)) }
                    : t
            )
        )
    }

    function handleSubtaskDeleted(taskId: string, subtaskId: string) {
        setTasks((prev) =>
            prev.map((t) =>
                t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subtaskId) } : t
            )
        )
    }

    async function handleArchiveTask(taskId: string) {
        const { data } = await api.patch<Task>(`/projects/${id}/tasks/${taskId}/archive`)
        setTasks((prev) => prev.filter((t) => t.id !== taskId))
        setArchivedTasks((prev) => [...prev, data])
    }

    async function handleRestoreTask(taskId: string) {
        const { data } = await api.patch<Task>(`/projects/${id}/tasks/${taskId}/restore`)
        setArchivedTasks((prev) => prev.filter((t) => t.id !== taskId))
        setTasks((prev) => [...prev, data].sort((a, b) => a.startDate.localeCompare(b.startDate)))
    }

    async function handleDeleteTaskPermanently(taskId: string) {
        const task = archivedTasks.find((t) => t.id === taskId)
        if (!task) return
        if (!window.confirm(`Supprimer définitivement « ${task.name} » ? Cette action est irréversible.`)) return

        await api.delete(`/projects/${id}/tasks/${taskId}`)
        setArchivedTasks((prev) => prev.filter((t) => t.id !== taskId))
    }

    return (
        <div className="min-h-screen bg-app flex flex-col">
            <Navbar />

            <main className="flex-1 flex flex-col px-8 py-8 w-full">
                <Link to="/" className="text-sm text-slate-500 hover:text-slate-700 transition">
                    ← Mes projets
                </Link>

                {loading ? (
                    <div className="text-sm text-slate-500 mt-6">Chargement…</div>
                ) : error || !project ? (
                    <div className="mt-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                        {error || 'Projet introuvable.'}
                    </div>
                ) : (
                    <>
                        <div className="mt-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <span
                                    className="w-2 h-9 rounded-full shrink-0"
                                    style={{ background: projectGlassBackground(project.color) }}
                                />
                                <div>
                                    <h1 className="text-xl font-semibold text-slate-800">{project.name}</h1>
                                    <p className="text-sm text-slate-500">{PROJECT_TYPE_LABELS[project.type]}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                                <ProjectStatusPicker
                                    status={project.status}
                                    canEdit={canManage}
                                    onChange={handleProjectStatusChange}
                                />
                                {canManage && (
                                    <button
                                        onClick={() => setEditingProject(true)}
                                        className="h-8 px-3 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-brand-500 transition"
                                    >
                                        Modifier
                                    </button>
                                )}
                                {isOwner && (
                                    <button
                                        onClick={handleArchiveProject}
                                        className="h-8 px-3 rounded-lg border border-border-strong text-xs text-slate-600 hover:border-red-400 hover:text-red-600 transition"
                                        title="Le projet quitte la liste de l'équipe, rien n'est perdu"
                                    >
                                        Archiver
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-6 border-b border-border">
                            {TABS.map((tab) => {
                                const locked = invitedOnly && tab.key !== 'info'
                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => !locked && selectTab(tab.key)}
                                        disabled={locked}
                                        title={
                                            locked
                                                ? "Accepte l'invitation pour accéder à cette vue"
                                                : undefined
                                        }
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
                                        setInvitations((prev) => [...prev, invitation])
                                    }
                                    onInvitationCancelled={(invitationId) =>
                                        setInvitations((prev) => prev.filter((i) => i.id !== invitationId))
                                    }
                                    onMemberRemoved={(memberId) => {
                                        setMembers((prev) => prev.filter((m) => m.id !== memberId))
                                        // Their tasks stay, but the server has just cleared
                                        // the assignee on them.
                                        setTasks((prev) =>
                                            prev.map((t) =>
                                                t.assignee?.id === memberId ? { ...t, assignee: null } : t
                                            )
                                        )
                                    }}
                                />
                            </div>
                        ) : (
                        <div className="mt-6 flex-1 bg-surface border border-border rounded-2xl p-6 flex flex-col">
                            {activeTab === 'planning' ? (
                                <>
                                    <div className="flex items-center gap-1 mb-4 self-start bg-surface-muted border border-border rounded-lg p-0.5">
                                        {PLANNING_VIEWS.map((view) => (
                                            <button
                                                key={view.key}
                                                onClick={() => setPlanningView(view.key)}
                                                className={`h-7 px-3 rounded-md text-xs font-medium transition ${
                                                    planningView === view.key
                                                        ? 'bg-surface text-slate-800 shadow-sm'
                                                        : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                            >
                                                {view.label}
                                            </button>
                                        ))}
                                    </div>

                                    {planningView === 'calendar' ? (
                                        <MonthCalendar
                                            tasks={tasks}
                                            onOpenTask={(task) => setSelectedTaskId(task.id)}
                                        />
                                    ) : (
                                        <GanttChart
                                            tasks={tasks}
                                            onOpenTask={(task) => setSelectedTaskId(task.id)}
                                        />
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-sm font-semibold text-slate-800">
                                            Tâches ({tasks.length})
                                        </h2>
                                        <button
                                            onClick={() => setShowCreateTask(true)}
                                            className="h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-xs font-medium transition"
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

            {selectedTask && id && (
                <TaskDetailModal
                    task={selectedTask}
                    projectId={id}
                    members={members}
                    onAssigneeChange={handleAssigneeChange}
                    onClose={() => setSelectedTaskId(null)}
                    onSubtaskAdded={handleSubtaskAdded}
                    onSubtaskToggled={handleSubtaskToggled}
                    onSubtaskDeleted={handleSubtaskDeleted}
                />
            )}
        </div>
    )
}
