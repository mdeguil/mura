import { useEffect, useRef, useState } from 'react'

const SIZES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
} as const

// The dialogs open, newest last. Échap belongs to the one on top: a
// confirmation opened from a dialog closes alone.
const openDialogs: symbol[] = []

/**
 * The frame every dialog shares: the dimmed backdrop, the panel, and what a
 * dialog owes keyboard and screen-reader users -- its role and name, Échap
 * to close, focus moved in on opening and handed back on closing.
 *
 * `labelledBy` is the id of the dialog's heading. What goes inside, the
 * coloured band included, is the dialog's own.
 */
export default function Modal({
    labelledBy,
    onClose,
    size = 'md',
    className = '',
    children,
}: {
    labelledBy: string
    onClose: () => void
    size?: keyof typeof SIZES
    className?: string
    children: React.ReactNode
}) {
    const panel = useRef<HTMLDivElement>(null)
    // Read while rendering, before a field marked autoFocus takes the focus
    // away from whatever opened the dialog.
    const [opener] = useState(() => document.activeElement as HTMLElement | null)
    // Read through a ref so a parent handing down a new callback on each
    // render does not reopen the dialog's bookkeeping.
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose

    useEffect(() => {
        const self = Symbol('dialog')
        openDialogs.push(self)

        // A field marked autoFocus has already taken the focus; otherwise
        // the panel takes it, so Tab starts inside the dialog.
        if (!panel.current?.contains(document.activeElement)) panel.current?.focus()

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape' && openDialogs[openDialogs.length - 1] === self) {
                event.stopPropagation()
                onCloseRef.current()
            }
        }
        document.addEventListener('keydown', onKeyDown)

        return () => {
            document.removeEventListener('keydown', onKeyDown)
            openDialogs.splice(openDialogs.indexOf(self), 1)
            opener?.focus?.()
        }
    }, [opener])

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-labelledby={labelledBy}
                tabIndex={-1}
                className={`bg-surface border border-border rounded-2xl w-full shadow-lg outline-none ${SIZES[size]} ${className}`}
            >
                {children}
            </div>
        </div>
    )
}
