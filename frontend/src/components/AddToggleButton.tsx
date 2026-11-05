/**
 * The round button that opens an "add someone" form and, turned a quarter,
 * closes it again.
 *
 * @param props whether the form is open, what opening it does, and the click
 */
export default function AddToggleButton({
    open,
    label,
    onClick,
}: {
    /** Whether the form it controls is open; the button then reads Annuler. */
    open: boolean
    /** What opening it does, said to screen readers and on hover. */
    label: string
    /** Opens or closes the form. */
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition ${
                open ? 'bg-surface-muted text-slate-500 rotate-45' : 'bg-brand-500 text-ink hover:bg-brand-600'
            }`}
            title={open ? 'Annuler' : label}
            aria-label={open ? 'Annuler' : label}
            aria-expanded={open}
        >
            <svg
                viewBox="0 0 16 16"
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
            >
                <path d="M8 3.5v9M3.5 8h9" />
            </svg>
        </button>
    )
}
