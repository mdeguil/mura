import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import MemberList from './MemberList'
import type { Invitation, Member, Project, Task } from '../types'
import { PROJECT_STATUS_CLASSES, PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from '../utils/projectMeta'
import { TASK_STATUS_BAR_CLASSES, TASK_STATUS_LABELS, TASK_STATUSES } from '../utils/taskMeta'

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-slate-400 mb-1">{label}</dt>
            <dd className="text-sm text-slate-700">{children}</dd>
        </div>
    )
}

export default function ProjectInfo({
    project,
    invitation,
    onAnswerInvitation,
    tasks,
    archivedCount,
    members,
    invitations,
    canManage,
    currentUserId,
    onInvited,
    onInvitationCancelled,
    onMemberRemoved,
}: {
    project: Project
    // Set only when the viewer holds a live invitation to this project.
    invitation: Invitation | null
    onAnswerInvitation: (accepted: boolean) => void
    tasks: Task[]
    archivedCount: number
    members: Member[]
    invitations: Invitation[]
    canManage: boolean
    currentUserId: string
    onInvited: (invitation: Invitation) => void
    onInvitationCancelled: (invitationId: string) => void
    onMemberRemoved: (memberId: string) => void
}) {
    const invitedOnly = project.access === 'INVITED'

    if (invitedOnly) {
        return (
            <div className="flex flex-col gap-4">
                <section className="bg-surface border border-brand-500/40 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-800 mb-1">
                        {invitation
                            ? `${invitation.invitedBy.username} t'invite à rejoindre ce projet`
                            : 'Tu es invité sur ce projet'}
                    </h2>
                    <p className="text-sm text-slate-500">
                        Tu vois sa description. Le planning, les tâches et l'équipe s'ouvrent une
                        fois l'invitation acceptée.
                    </p>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => onAnswerInvitation(true)}
                            disabled={!invitation}
                            className="h-9 px-4 rounded-lg bg-gradient-to-r from-blue-600 via-brand-500 to-emerald-400 hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                        >
                            Rejoindre le projet
                        </button>
                        <button
                            onClick={() => onAnswerInvitation(false)}
                            disabled={!invitation}
                            className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface-muted transition disabled:opacity-60"
                        >
                            Refuser
                        </button>
                    </div>
                </section>

                <section className="bg-surface border border-border rounded-xl p-5">
                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                        <Fact label="Type">{PROJECT_TYPE_LABELS[project.type]}</Fact>
                        <Fact label="Statut">
                            <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${PROJECT_STATUS_CLASSES[project.status]}`}
                            >
                                {PROJECT_STATUS_LABELS[project.status]}
                            </span>
                        </Fact>
                        <Fact label="Début">
                            {project.startDate
                                ? format(new Date(project.startDate), 'dd MMMM yyyy', { locale: fr })
                                : <span className="text-slate-400">Non définie</span>}
                        </Fact>
                    </dl>
                </section>

                <section className="bg-surface border border-border rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-800 mb-3">À propos</h2>
                    {project.description ? (
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {project.description}
                        </p>
                    ) : (
                        <p className="text-sm text-slate-400">Ce projet n'a pas encore de description.</p>
                    )}
                </section>
            </div>
        )
    }

    const counts = TASK_STATUSES.map((status) => ({
        status,
        count: tasks.filter((t) => t.status === status).length,
    }))
    const done = counts.find((c) => c.status === 'TERMINE')?.count ?? 0

    return (
        <div className="flex flex-col gap-4">
            {/* The one thing worth coming to this tab for: where the project
                stands, in the same colours the task board already taught. */}
            <section className="bg-surface border border-border rounded-xl p-5">
                <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h2 className="text-sm font-semibold text-slate-800">Avancement</h2>
                    <p className="text-sm text-slate-500">
                        {tasks.length === 0 ? (
                            'Aucune tâche'
                        ) : (
                            <>
                                <span className="text-slate-800 font-medium">{done}</span> / {tasks.length} terminées
                            </>
                        )}
                    </p>
                </div>

                {tasks.length === 0 ? (
                    <p className="text-sm text-slate-400">
                        Les tâches créées dans l'onglet Tâches apparaîtront ici.
                    </p>
                ) : (
                    <>
                        <div className="flex h-2 rounded-full overflow-hidden bg-surface-muted">
                            {counts
                                .filter(({ count }) => count > 0)
                                .map(({ status, count }) => (
                                    <div
                                        key={status}
                                        className={TASK_STATUS_BAR_CLASSES[status]}
                                        style={{ width: `${(count / tasks.length) * 100}%` }}
                                        title={`${TASK_STATUS_LABELS[status]} : ${count}`}
                                    />
                                ))}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3">
                            {counts.map(({ status, count }) => (
                                <div key={status} className="flex items-center gap-1.5">
                                    <span
                                        className={`w-2 h-2 rounded-full ${TASK_STATUS_BAR_CLASSES[status]}`}
                                    />
                                    <span className="text-xs text-slate-500">
                                        {TASK_STATUS_LABELS[status]}
                                        <span className="text-slate-800 font-medium ml-1">{count}</span>
                                    </span>
                                </div>
                            ))}
                            {archivedCount > 0 && (
                                <span className="text-xs text-slate-400">· {archivedCount} archivée{archivedCount > 1 ? 's' : ''}</span>
                            )}
                        </div>
                    </>
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <section className="bg-surface border border-border rounded-xl p-5">
                        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                            <Fact label="Type">{PROJECT_TYPE_LABELS[project.type]}</Fact>
                            <Fact label="Statut">
                                <span
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${PROJECT_STATUS_CLASSES[project.status]}`}
                                >
                                    {PROJECT_STATUS_LABELS[project.status]}
                                </span>
                            </Fact>
                            <Fact label="Début">
                                {project.startDate
                                    ? format(new Date(project.startDate), 'dd MMMM yyyy', { locale: fr })
                                    : <span className="text-slate-400">Non définie</span>}
                            </Fact>
                        </dl>
                    </section>

                    <section className="bg-surface border border-border rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-slate-800 mb-3">À propos</h2>
                        {project.description ? (
                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                {project.description}
                            </p>
                        ) : (
                            <p className="text-sm text-slate-400">Ce projet n'a pas encore de description.</p>
                        )}
                    </section>
                </div>

                <MemberList
                    projectId={project.id}
                    members={members}
                    invitations={invitations}
                    canManage={canManage}
                    currentUserId={currentUserId}
                    onInvited={onInvited}
                    onInvitationCancelled={onInvitationCancelled}
                    onRemoved={onMemberRemoved}
                />
            </div>
        </div>
    )
}
