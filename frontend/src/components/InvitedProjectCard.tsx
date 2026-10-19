import { Link } from 'react-router-dom'
import type { Invitation } from '../types'
import { projectGlassBackground } from '../utils/color'

// Deliberately not a ProjectCard: this is not one of your projects yet, and
// a dashed edge says so before the text does.
export default function InvitedProjectCard({ invitation }: { invitation: Invitation }) {
    return (
        <Link
            to={`/project/${invitation.projectId}`}
            className="block relative bg-surface border border-dashed border-border-strong rounded-xl p-4 pb-5 overflow-hidden hover:border-brand-500 transition"
        >
            <h3 className="text-sm font-medium text-slate-800 pr-20">{invitation.projectName}</h3>
            <p className="text-xs text-slate-500 mt-1">
                Invité par <span className="text-slate-700">{invitation.invitedBy.username}</span>
            </p>
            <p className="text-xs text-brand-700 mt-3">Voir le projet et répondre →</p>

            <span className="absolute top-4 right-4 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                Invitation
            </span>
            <span
                className="absolute inset-x-0 bottom-0 h-1.5"
                style={{ background: projectGlassBackground(invitation.projectColor) }}
            />
        </Link>
    )
}
