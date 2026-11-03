import { useEffect } from 'react'
import { useProjectTypes } from '../hooks/useProjectTypes'
import { PROJECT_COLORS, projectGlassBackground } from '../utils/color'

export const FIELD =
    'w-full h-10 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition'
export const LABEL = 'block text-xs font-medium text-slate-600 mb-1.5'

export type ProjectFormValues = {
    name: string
    description: string
    color: string
    typeId: string
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
    const { types, loading: loadingTypes } = useProjectTypes()

    // A select whose value matches no option still shows the first one, so a
    // form opened before the types arrived would read "Web" and submit
    // nothing. Choosing one as soon as they land keeps the two honest.
    useEffect(() => {
        if (!values.typeId && types.length > 0) {
            onChange({ typeId: types[0].id })
        }
    }, [types, values.typeId, onChange])
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
                        value={values.typeId}
                        onChange={(e) => onChange({ typeId: e.target.value })}
                        disabled={loadingTypes}
                        className={FIELD}
                    >
                        {/* Empty only while the list is on its way: a project
                            cannot be saved without a type, and the form would
                            otherwise show the first one as if it were chosen. */}
                        {loadingTypes && <option value="">Chargement…</option>}
                        {types.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.emoji} {t.label}
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
