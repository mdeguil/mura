import { useTranslation } from 'react-i18next'
import ProjectStatusPicker from './ProjectStatusPicker'
import type { Project, ProjectStatus } from '../types'
import { projectGlassBackground } from '../utils/color'
import { projectTypeLabel } from '../utils/projectMeta'

/**
 * The project's name and what can be done to it as a whole. Editing is part
 * of running the team; archiving stays with the owner.
 *
 * @param props the project, what the viewer may do and what to do on each action
 */
export default function ProjectHeader({
    project,
    canManage,
    isOwner,
    onStatusChange,
    onEdit,
    onArchive,
}: {
    /** The project shown. */
    project: Project
    /** Whether the viewer may edit it and change its status. */
    canManage: boolean
    /** Whether the viewer owns it, and so may archive it. */
    isOwner: boolean
    /** Called with the status picked. */
    onStatusChange: (status: ProjectStatus) => void
    /** Called to open the edit dialog. */
    onEdit: () => void
    /** Called to open the archive dialog. */
    onArchive: () => void
}) {
    const { t } = useTranslation()
    return (
        <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <span
                    className="w-2 h-9 rounded-full shrink-0"
                    style={{ background: projectGlassBackground(project.color) }}
                />
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">{project.name}</h1>
                    <p className="text-sm text-slate-500">{projectTypeLabel(project.type)}</p>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <ProjectStatusPicker status={project.status} canEdit={canManage} onChange={onStatusChange} />
                {canManage && (
                    <button
                        onClick={onEdit}
                        className="h-8 px-3 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-medium transition flex items-center gap-1.5"
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                        </svg>
                        {t('projects.header.edit')}
                    </button>
                )}
                {isOwner && (
                    <button
                        onClick={onArchive}
                        className="h-8 px-3 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium transition flex items-center gap-1.5"
                        title={t('projects.header.archiveHint')}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                        >
                            <path d="M3 8v12h18V8" />
                            <path d="M1 3h22v5H1z" />
                            <path d="M10 12h4" />
                        </svg>
                        {t('projects.header.archive')}
                    </button>
                )}
            </div>
        </div>
    )
}
