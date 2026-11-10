import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { dateLocale } from '../utils/dates'
import type { Invitation } from '../types'
import { projectGlassBackground } from '../utils/color'

/**
 * A project the reader is invited to, leading to it so they can look and
 * answer. Deliberately not a ProjectCard: this is not one of your projects
 * yet, and a dashed edge says so before the text does.
 *
 * @param props the invitation
 */
export default function InvitedProjectCard({
    invitation,
}: {
    /** The pending invitation. */
    invitation: Invitation
}) {
    const { t } = useTranslation()
    return (
        <Link
            to={`/project/${invitation.projectId}`}
            className="block relative bg-surface border border-dashed border-border-strong rounded-xl p-4 pb-5 overflow-hidden hover:border-brand-500 transition"
        >
            <h3 className="text-sm font-medium text-slate-800 pr-20">{invitation.projectName}</h3>
            <p className="text-xs text-slate-500 mt-1">
                <Trans
                    i18nKey="projects.invited.by"
                    values={{ name: invitation.invitedBy.username }}
                    components={{ strong: <span className="text-slate-700" /> }}
                />
            </p>
            <p className="text-xs text-brand-700 mt-3">{t('projects.invited.open')}</p>
            <p className="text-xs text-slate-400 mt-1">
                {t('projects.invited.expires', {
                    when: formatDistanceToNow(new Date(invitation.expiresAt), { addSuffix: true, locale: dateLocale() }),
                })}
            </p>

            <span className="absolute top-4 right-4 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {t('projects.invited.badge')}
            </span>
            <span
                className="absolute inset-x-0 bottom-0 h-1.5"
                style={{ background: projectGlassBackground(invitation.projectColor) }}
            />
        </Link>
    )
}
