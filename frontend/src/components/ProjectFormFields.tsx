import { useEffect } from 'react'
import { useProjectTypes } from '../hooks/useProjectTypes'
import { PROJECT_COLORS, projectGlassBackground } from '../utils/color'

/** The classes of a text field in the project forms. */
export const FIELD =
    'w-full h-10 rounded-lg border border-border-strong bg-surface-muted px-3 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-brand-500 transition'
/** The classes of a field's label in the project forms. */
export const LABEL = 'block text-xs font-medium text-slate-600 mb-1.5'

/** What the project forms hold, as the fields edit it. */
export type ProjectFormValues = {
    /** The project's name. */
    name: string
    /** Its description, `''` for none. */
    description: string
    /** Its colour, as `#rrggbb`. */
    color: string
    /** Its type's id, `''` until the types have loaded. */
    typeId: string
    /** When it starts, as `YYYY-MM-DD`, `''` for none. */
    startDate: string
}

/**
 * The fields of a project: name, type, start date and description. Shared
 * by the create and edit dialogs so the two never drift apart; what differs
 * between them (who to invite, what status) stays in each dialog.
 *
 * @param props the values and what to do as they change
 */
export default function ProjectFormFields({
    values,
    onChange,
    autoFocus = false,
}: {
    /** What the fields show. */
    values: ProjectFormValues
    /** Called with the fields that changed. */
    onChange: (patch: Partial<ProjectFormValues>) => void
    /** Puts the focus on the name. */
    autoFocus?: boolean
}) {
    const { types, loading: loadingTypes, error: typesError } = useProjectTypes()

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
                        {loadingTypes && <option value="">Chargement…</option>}
                        {types.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.emoji} {t.label}
                            </option>
                        ))}
                    </select>
                    {typesError && (
                        <p role="alert" className="text-xs text-red-600 mt-1">
                            {typesError}
                        </p>
                    )}
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

/**
 * The row of colour swatches a project can be given.
 *
 * @param props the chosen colour and what to do on a change
 */
export function ColorPicker({
    color,
    onChange,
}: {
    /** The chosen colour, as `#rrggbb`. */
    color: string
    /** Called with the swatch clicked. */
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
