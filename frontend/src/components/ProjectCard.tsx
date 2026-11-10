import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { dateLocale } from '../utils/dates'
import type { Project } from '../types'
import { projectGlassBackground } from '../utils/color'
import { PROJECT_STATUS_CLASSES, PROJECT_STATUS_LABELS, projectTypeLabel } from '../utils/projectMeta'

/**
 * A project's card in the list: its name, type, dates, description and team
 * size, as a link to the project's page.
 *
 * @param props the project shown
 */
export default function ProjectCard({ project }: {
    /** The project shown. */
    project: Project
}) {
    const { t } = useTranslation()
    return (
        <Link
            to={`/project/${project.id}`}
            className="relative block bg-surface border border-border rounded-xl p-4 pb-6 shadow-lg shadow-black/10 transition hover:shadow-xl hover:shadow-black/15 hover:-translate-y-1 overflow-hidden"
        >
            <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-800 truncate">{project.name}</h3>
                {project.members.length > 0 && (
                    <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap">
                        👥 {project.members.length}
                    </span>
                )}
            </div>

            <p className="text-xs text-slate-500 mt-1">{projectTypeLabel(project.type)}</p>
            {project.startDate && (
                <p className="text-xs text-slate-500">
                    {t('projects.card.startDate', { date: format(new Date(project.startDate), 'dd/MM/yyyy', { locale: dateLocale() }) })}
                </p>
            )}
            {project.completedAt && (
                <p className="text-xs text-emerald-700">
                    {t('projects.card.completedOn', { date: format(new Date(project.completedAt), 'dd/MM/yyyy', { locale: dateLocale() }) })}
                </p>
            )}

            {project.description && (
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{project.description}</p>
            )}

            <div className="flex justify-end mt-2.5">
                <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${PROJECT_STATUS_CLASSES[project.status]}`}
                >
                    {PROJECT_STATUS_LABELS[project.status]}
                </span>
            </div>

            <div
                className="absolute inset-x-0 bottom-0 h-4 rounded-b-xl border-t border-white/40"
                style={{ background: projectGlassBackground(project.color) }}
            />
        </Link>
    )
}
