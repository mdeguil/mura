import { Link } from 'react-router-dom'
import ProjectInviteMenu from './ProjectInviteMenu'
import UserAvatar, { SuspendedPill } from './UserAvatar'
import type { KnownUser, Project } from '../types'
import { projectGlassBackground } from '../utils/color'

/**
 * One person in the carnet: who they are, the projects shared with them,
 * and what can be done from here -- invite them on, star them, take them
 * out of the list.
 *
 * @param props the person, the reader's projects, and the two actions
 */
export default function ContactCard({
    person,
    projects,
    currentUserId,
    onToggleFavourite,
    onRemove,
}: {
    /** The person. */
    person: KnownUser
    /** The reader's own projects, to offer in the invite menu. */
    projects: Project[]
    /** The reader, to tell which projects they may invite onto. */
    currentUserId: string
    /** Stars or un-stars the person. */
    onToggleFavourite: () => void
    /** Asks to take the person out of the carnet. */
    onRemove: () => void
}) {
    return (
        <li
            className="flex items-start gap-3 bg-surface border border-border rounded-xl px-4 py-3"
        >
            <UserAvatar user={{ ...person, email: person.email }} />
            <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-800 flex items-center gap-1.5">
                    <span className="truncate">{person.username}</span>
                    {person.suspended && <SuspendedPill />}
                </p>
                {person.email && (
                    <p className="text-xs text-slate-400 truncate">{person.email}</p>
                )}

                {person.sharedProjects.length > 0 ? (
                    <ul className="flex flex-wrap gap-1.5 mt-2">
                        {person.sharedProjects.map((project) => (
                            <li key={project.id}>
                                <Link
                                    to={`/project/${project.id}`}
                                    className="flex items-center gap-1.5 bg-surface-muted border border-border rounded-full pl-1.5 pr-2.5 py-0.5 hover:border-brand-500 transition"
                                >
                                    <span
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            background: projectGlassBackground(project.color),
                                        }}
                                    />
                                    <span className="text-xs text-slate-600">
                                        {project.name}
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-xs text-slate-400 mt-2 italic">
                        Aucun projet en commun pour l'instant.
                    </p>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-0.5">
                <span className="text-xs text-slate-400">
                    {person.pending
                        ? 'En attente'
                        : person.sharedProjects.length > 0
                          ? `${person.sharedProjects.length} projet${person.sharedProjects.length > 1 ? 's' : ''}`
                          : person.saved
                            ? 'Ajouté'
                            : 'Invitation'}
                </span>
                {!person.pending && (
                    <ProjectInviteMenu
                        person={person}
                        projects={projects}
                        currentUserId={currentUserId}
                    />
                )}
                <button
                    onClick={onToggleFavourite}
                    aria-pressed={person.favourite}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-xl leading-none transition ${
                        person.favourite
                            ? 'text-amber-400 hover:bg-amber-50'
                            : 'text-slate-300 hover:text-amber-400 hover:bg-surface-muted'
                    }`}
                    title={
                        person.favourite
                            ? 'Retirer des favoris'
                            : 'Mettre en favori'
                    }
                    aria-label={
                        person.favourite
                            ? `Retirer ${person.username} des favoris`
                            : `Mettre ${person.username} en favori`
                    }
                >
                    {person.favourite ? '★' : '☆'}
                </button>
                <button
                    onClick={onRemove}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Retirer de mon carnet"
                    aria-label={`Retirer ${person.username} de mon carnet`}
                >
                    {/* A person with a minus, not a bin: nothing is destroyed
                        here — they keep their account, their projects, and
                        their own carnet. Only this list loses them. */}
                    <svg
                        viewBox="0 0 24 24"
                        className="w-[18px] h-[18px]"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <path d="M17 11h6" />
                    </svg>
                </button>
            </div>
        </li>
    )
}
