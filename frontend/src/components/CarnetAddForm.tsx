import { useId, useState } from 'react'
import CarnetCombobox from './CarnetCombobox'

// Adding someone by name or by address, with the carnet behind the field:
// two letters of a name are enough, and an address nobody has met yet still
// goes through. Picking a suggestion sends it straight away.
export default function CarnetAddForm({
    label,
    submitLabel,
    busyLabel,
    busy,
    excludeIds,
    onSubmit,
    onEscape,
    hint,
}: {
    label: string
    submitLabel: string
    busyLabel: string
    busy: boolean
    // People the list should not offer: already in, or already asked.
    excludeIds: string[]
    onSubmit: (address: string) => void
    onEscape: () => void
    hint?: string
}) {
    const [email, setEmail] = useState('')
    const fieldId = useId()

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault()
                if (email.trim()) onSubmit(email.trim())
            }}
            className="mb-4"
        >
            <label htmlFor={fieldId} className="block text-xs font-medium text-slate-600 mb-1.5">
                {label}
            </label>
            <div className="flex gap-2">
                <CarnetCombobox
                    id={fieldId}
                    className="flex-1 min-w-0"
                    value={email}
                    onChange={setEmail}
                    onPick={(person) => person.email && onSubmit(person.email)}
                    onEscape={onEscape}
                    autoFocus
                    placeholder="Un nom du carnet, ou prenom@exemple.com"
                    excludeIds={excludeIds}
                />
                <button
                    type="submit"
                    disabled={busy || !email.trim()}
                    className="h-9 px-3 rounded-lg bg-brand-gradient hover:opacity-90 text-white text-xs font-medium transition disabled:opacity-60 shrink-0"
                >
                    {busy ? busyLabel : submitLabel}
                </button>
            </div>
            {hint && <p className="text-xs text-slate-400 mt-1.5">{hint}</p>}
        </form>
    )
}
