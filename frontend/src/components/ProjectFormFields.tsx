import type { ProjectType } from '../types'
import { projectGlassBackground } from '../utils/color'
import { PROJECT_TYPE_LABELS } from '../utils/projectMeta'

export const PROJECT_COLORS = ['#06b6d4', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#22c55e']
const TYPES = Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]

export const FIELD =
    'w-full h-10 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition'
export const LABEL = 'block text-xs font-medium text-slate-600 mb-1.5'

export type ProjectFormValues = {
    name: string
    description: string
    color: string
    type: ProjectType
    startDate: string
}

// Shared by the create and edit dialogs so the two never drift apart; what
// differs between them (who to invite, what status) stays in each dialog.
export default function ProjectFormFields({
    values,
    onChange,
    autoFocus = false,
}: {
    values: ProjectFormValues
    onChange: (patch: Partial<ProjectFormValues>) => void
    autoFocus?: boolean
}) {
    return (
        <>
            <div>
                <label className={LABEL}>Nom</label>
                <input
                    type="text"
                    value={values.name}
                    onChange={(e) => onChange({ name: e.target.value })}
                    placeholder="Mon nouveau projet"
                    required
                    maxLength={255}
                    autoFocus={autoFocus}
                    className={FIELD}
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className={LABEL}>Type</label>
                    <select
                        value={values.type}
                        onChange={(e) => onChange({ type: e.target.value as ProjectType })}
                        className={FIELD}
                    >
                        {TYPES.map((t) => (
                            <option key={t} value={t}>
                                {PROJECT_TYPE_LABELS[t]}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className={LABEL}>Date de début</label>
                    <input
                        type="date"
                        value={values.startDate}
                        onChange={(e) => onChange({ startDate: e.target.value })}
                        className={FIELD}
                    />
                </div>
            </div>

            <div>
                <label className={LABEL}>Description (optionnel)</label>
                <textarea
                    value={values.description}
                    onChange={(e) => onChange({ description: e.target.value })}
                    placeholder="De quoi parle ce projet ?"
                    rows={5}
                    maxLength={2000}
                    className="w-full rounded-lg border border-border-strong bg-surface-muted px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition resize-none"
                />
            </div>
        </>
    )
}

export function ColorPicker({
    color,
    onChange,
}: {
    color: string
    onChange: (color: string) => void
}) {
    return (
        <div>
            <label className={LABEL}>Couleur</label>
            <div className="flex gap-2">
                {PROJECT_COLORS.map((c) => (
                    <button
                        key={c}
                        type="button"
                        onClick={() => onChange(c)}
                        style={{ background: projectGlassBackground(c) }}
                        className={`w-8 h-8 rounded-full transition ${
                            color === c ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                        }`}
                        aria-label={c}
                        aria-pressed={color === c}
                    />
                ))}
            </div>
        </div>
    )
}
