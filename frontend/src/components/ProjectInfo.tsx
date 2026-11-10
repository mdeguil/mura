import { Trans, useTranslation } from 'react-i18next'
import { format } from 'date-fns'
import { dateLocale } from '../utils/dates'
import MemberList from './MemberList'
import type { Invitation, Member, Project, Task } from '../types'
import { PROJECT_STATUS_CLASSES, PROJECT_STATUS_LABELS, projectTypeLabel } from '../utils/projectMeta'
import { TASK_STATUS_BAR_CLASSES, TASK_STATUS_LABELS, TASK_STATUSES } from '../utils/taskMeta'

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <dt className="text-xs text-slate-400 mb-1">{label}</dt>
            <dd className="text-sm text-slate-700">{children}</dd>
        </div>
    )
}

/**
 * The Informations tab of a project: its facts, how its tasks stand and its
 * team. Someone only invited sees the facts and the team with the
 * invitation to answer, and nothing of the tasks.
 *
 * @param props the project, its tasks and team, and what to do as they change
 */
export default function ProjectInfo({
    project,
    invitation,
    onAnswerInvitation,
    tasks,
    archivedCount,
    members,
    invitations,
    canManage,
    isOwner,
    currentUserId,
    onInvited,
    onInvitationCancelled,
    onMemberRemoved,
    onMembersChanged,
}: {
    /** The project shown. */
    project: Project
    /** Set only when the viewer holds a live invitation to this project. */
    invitation: Invitation | null
    /** Called with `true` to join the project, `false` to decline. */
    onAnswerInvitation: (accepted: boolean) => void
    /** The project's live tasks. */
    tasks: Task[]
    /** How many of its tasks are archived. */
    archivedCount: number
    /** The project's members. */
    members: Member[]
    /** The invitations still waiting for an answer. */
    invitations: Invitation[]
    /** Whether the viewer may invite and remove members. */
    canManage: boolean
    /** Whether the viewer owns the project. */
    isOwner: boolean
    /** The viewer's account id. */
    currentUserId: string
    /** Called with an invitation just sent. */
    onInvited: (invitation: Invitation) => void
    /** Called with the id of an invitation just withdrawn. */
    onInvitationCancelled: (invitationId: string) => void
    /** Called with the id of a member just removed. */
    onMemberRemoved: (memberId: string) => void
    /** Called with the whole team when it changed some other way. */
    onMembersChanged: (members: Member[]) => void
}) {
    const { t } = useTranslation()
    const invitedOnly = project.access === 'INVITED'

    if (invitedOnly) {
        return (
            <div className="flex flex-col gap-4">
                <section className="bg-surface border border-brand-500/40 rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-800 mb-1">
                        {invitation
                            ? t('info.invitedBy', { name: invitation.invitedBy.username })
                            : t('info.invited')}
                    </h2>
                    <p className="text-sm text-slate-500">
                        {t('info.invitedHint')}
                    </p>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => onAnswerInvitation(true)}
                            disabled={!invitation}
                            className="h-9 px-4 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-sm font-medium transition disabled:opacity-60"
                        >
                            {t('info.join')}
                        </button>
                        <button
                            onClick={() => onAnswerInvitation(false)}
                            disabled={!invitation}
                            className="h-9 px-4 rounded-lg text-sm font-medium text-slate-600 hover:bg-surface-muted transition disabled:opacity-60"
                        >
                            {t('info.decline')}
                        </button>
                    </div>
                </section>

                <section className="bg-surface border border-border rounded-xl p-5">
                    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                        <Fact label={t('info.type')}>{projectTypeLabel(project.type)}</Fact>
                        <Fact label={t('info.status')}>
                            <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${PROJECT_STATUS_CLASSES[project.status]}`}
                            >
                                {PROJECT_STATUS_LABELS[project.status]}
                            </span>
                        </Fact>
                        <Fact label={t('info.start')}>
                            {project.startDate
                                ? format(new Date(project.startDate), 'dd MMMM yyyy', { locale: dateLocale() })
                                : <span className="text-slate-400">{t('info.undefined')}</span>}
                        </Fact>
                    </dl>
                </section>

                <section className="bg-surface border border-border rounded-xl p-5">
                    <h2 className="text-sm font-semibold text-slate-800 mb-3">{t('info.about')}</h2>
                    {project.description ? (
                        <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                            {project.description}
                        </p>
                    ) : (
                        <p className="text-sm text-slate-400">{t('info.noDescription')}</p>
                    )}
                </section>

                <MemberList
                    projectId={project.id}
                    members={members}
                    invitations={[]}
                    canManage={false}
                    isOwner={false}
                    currentUserId={currentUserId}
                    onInvited={() => {}}
                    onInvitationCancelled={() => {}}
                    onRemoved={() => {}}
                    onMembersChanged={() => {}}
                />
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
            <section className="bg-surface border border-border rounded-xl p-5">
                <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h2 className="text-sm font-semibold text-slate-800">{t('info.progress')}</h2>
                    <p className="text-sm text-slate-500">
                        {tasks.length === 0 ? (
                            t('info.noTask')
                        ) : (
                            <Trans
                                i18nKey="info.done"
                                values={{ done, total: tasks.length }}
                                components={{ strong: <span className="text-slate-800 font-medium" /> }}
                            />
                        )}
                    </p>
                </div>

                {tasks.length === 0 ? (
                    <p className="text-sm text-slate-400">
                        {t('info.noTaskHint')}
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
                                        title={t('info.statusCount', { status: TASK_STATUS_LABELS[status], count })}
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
                                <span className="text-xs text-slate-400">{t('info.archived', { count: archivedCount })}</span>
                            )}
                        </div>
                    </>
                )}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <section className="bg-surface border border-border rounded-xl p-5">
                        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                            <Fact label={t('info.type')}>{projectTypeLabel(project.type)}</Fact>
                            <Fact label={t('info.status')}>
                                <span
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${PROJECT_STATUS_CLASSES[project.status]}`}
                                >
                                    {PROJECT_STATUS_LABELS[project.status]}
                                </span>
                            </Fact>
                            <Fact label={t('info.start')}>
                                {project.startDate
                                    ? format(new Date(project.startDate), 'dd MMMM yyyy', { locale: dateLocale() })
                                    : <span className="text-slate-400">{t('info.undefined')}</span>}
                            </Fact>
                            {project.completedAt && (
                                <Fact label={t('info.completedOn')}>
                                    {format(new Date(project.completedAt), 'dd MMMM yyyy', { locale: dateLocale() })}
                                </Fact>
                            )}
                        </dl>
                    </section>

                    <section className="bg-surface border border-border rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-slate-800 mb-3">{t('info.about')}</h2>
                        {project.description ? (
                            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                                {project.description}
                            </p>
                        ) : (
                            <p className="text-sm text-slate-400">{t('info.noDescription')}</p>
                        )}
                    </section>
                </div>

                <MemberList
                    projectId={project.id}
                    members={members}
                    invitations={invitations}
                    canManage={canManage}
                    isOwner={isOwner}
                    currentUserId={currentUserId}
                    onInvited={onInvited}
                    onInvitationCancelled={onInvitationCancelled}
                    onRemoved={onMemberRemoved}
                    onMembersChanged={onMembersChanged}
                />
            </div>
        </div>
    )
}
