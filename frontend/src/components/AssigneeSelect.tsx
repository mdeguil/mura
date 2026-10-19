import type { Member } from '../types'

export default function AssigneeSelect({
    members,
    value,
    onChange,
    disabled,
    // Inline next to a label by default; the create form wants a field that
    // lines up with its other inputs.
    fullWidth = false,
}: {
    members: Member[]
    value: string | null
    onChange: (assigneeId: string | null) => void
    disabled?: boolean
    fullWidth?: boolean
}) {
    return (
        <select
            value={value ?? ''}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value === '' ? null : e.target.value)}
            className={`${
                fullWidth ? 'w-full h-9 px-3 text-sm' : 'h-8 px-2 text-xs'
            } rounded-lg border border-border-strong bg-surface-muted text-slate-700 outline-none focus:border-brand-500 transition disabled:opacity-60`}
        >
            <option value="">Personne</option>
            {members.map((member) => (
                <option key={member.id} value={member.id}>
                    {member.username}
                </option>
            ))}
        </select>
    )
}
