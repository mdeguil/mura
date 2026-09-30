import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Navbar from '../components/Navbar'
import CreateTaskModal from '../components/CreateTaskModal'
import GanttChart from '../components/GanttChart'
import TaskBoard from '../components/TaskBoard'
import ArchivedTasks from '../components/ArchivedTasks'
import api from '../services/api'
import type { Project, Task, TaskStatus } from '../types'
import { PROJECT_STATUS_CLASSES, PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from '../utils/projectMeta'
import { projectGlassBackground } from '../utils/color'

type ProjectTab = 'info' | 'planning' | 'tasks'

const TABS: { key: ProjectTab; label: string }[] = [
    { key: 'info', label: 'Infos' },
    { key: 'planning', label: 'Planning' },
    { key: 'tasks', label: 'Tâches' },
]

export default function ProjectPage() {
    const { id } = useParams<{ id: string }>()
    const [project, setProject] = useState<Project | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [tasks, setTasks] = useState<Task[]>([])
    const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
    const [showArchived, setShowArchived] = useState(false)
    const [showCreateTask, setShowCreateTask] = useState(false)
    const [activeTab, setActiveTab] = useState<ProjectTab>('info')

    useEffect(() => {
        let cancelled = false

        api.get<Project>(`/projects/${id}`)
            .then(({ data }) => {
                if (!cancelled) setProject(data)
            })
            .catch(() => {
                if (!cancelled) setError('Impossible de charger ce projet.')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [id])

    useEffect(() => {
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

        return () => {
            cancelled = true
        }
    }, [id])

    function handleTaskCreated(task: Task) {
        setTasks((prev) => [...prev, task].sort((a, b) => a.startDate.localeCompare(b.startDate)))
    }

    async function handleStatusChange(taskId: string, status: TaskStatus) {
        const task = tasks.find((t) => t.id === taskId)
        if (!task) return

        const { data } = await api.put<Task>(`/projects/${id}/tasks/${taskId}`, {
            name: task.name,
            description: task.description,
            status,
            startDate: task.startDate,
            endDate: task.endDate,
        })
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data : t)))
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
                            <span
                                className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${PROJECT_STATUS_CLASSES[project.status]}`}
                            >
                                {PROJECT_STATUS_LABELS[project.status]}
                            </span>
                        </div>

                        <div className="mt-6 flex items-center gap-6 border-b border-border">
                            {TABS.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`pb-3 -mb-px text-sm font-medium border-b-2 transition ${
                                        activeTab === tab.key
                                            ? 'text-slate-800 border-brand-500'
                                            : 'text-slate-500 border-transparent hover:text-slate-700'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="mt-6 flex-1 bg-surface border border-border rounded-2xl p-6 flex flex-col">
                            {activeTab === 'info' ? (
                                <div>
                                    {project.startDate && (
                                        <p className="text-sm text-slate-500">
                                            Date de début : {format(new Date(project.startDate), 'dd/MM/yyyy', { locale: fr })}
                                        </p>
                                    )}

                                    {project.description && (
                                        <p className="text-sm text-slate-600 mt-4 whitespace-pre-wrap">{project.description}</p>
                                    )}

                                    <div className="mt-6 pt-6 border-t border-border">
                                        <h2 className="text-xs font-medium text-slate-500 mb-3">
                                            Membres ({project.members.length})
                                        </h2>
                                        <div className="flex flex-wrap gap-3">
                                            {project.members.map((member) => (
                                                <div key={member.id} className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 via-brand-500 to-emerald-400 flex items-center justify-center text-white text-xs font-semibold">
                                                        {member.username[0]?.toUpperCase()}
                                                    </div>
                                                    <span className="text-sm text-slate-600">
                                                        {member.username}
                                                        {member.id === project.owner.id && (
                                                            <span className="text-slate-400"> · propriétaire</span>
                                                        )}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : activeTab === 'planning' ? (
                                <GanttChart tasks={tasks} />
                            ) : (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-sm font-semibold text-slate-800">
                                            Tâches ({tasks.length})
                                        </h2>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setShowArchived((v) => !v)}
                                                className="text-xs text-slate-500 hover:text-slate-700 transition underline"
                                            >
                                                {showArchived ? 'Masquer les archives' : `Archives (${archivedTasks.length})`}
                                            </button>
                                            <button
                                                onClick={() => setShowCreateTask(true)}
                                                className="h-8 px-3 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-xs font-medium transition"
                                            >
                                                + Nouvelle tâche
                                            </button>
                                        </div>
                                    </div>
                                    <TaskBoard tasks={tasks} onStatusChange={handleStatusChange} onArchive={handleArchiveTask} />

                                    {showArchived && (
                                        <div className="mt-6 pt-6 border-t border-border">
                                            <ArchivedTasks
                                                tasks={archivedTasks}
                                                onRestore={handleRestoreTask}
                                                onDelete={handleDeleteTaskPermanently}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </>
                )}
            </main>

            {showCreateTask && id && (
                <CreateTaskModal
                    projectId={id}
                    onClose={() => setShowCreateTask(false)}
                    onCreated={handleTaskCreated}
                />
            )}
        </div>
    )
}
