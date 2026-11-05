import { useEffect, useRef, useState } from 'react'

const SIZES = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
} as const

const openDialogs: symbol[] = []

/**
 * The frame every dialog shares: the dimmed backdrop, the panel, and what a
 * dialog owes keyboard and screen-reader users -- its role and name, Échap
 * to close, focus moved in on opening and handed back on closing.
 *
 * What goes inside, the coloured band included, is the dialog's own.
 *
 * @param props the dialog's name, how it closes, its size and content
 */
export default function Modal({
    labelledBy,
    onClose,
    size = 'md',
    className = '',
    children,
}: {
    /** The id of the dialog's heading, which names it for screen readers. */
    labelledBy: string
    /** Called on Escape, when this dialog is the one on top. */
    onClose: () => void
    /** How wide the panel may grow. */
    size?: keyof typeof SIZES
    /** Extra classes for the panel: padding, height, overflow. */
    className?: string
    /** The dialog's content. */
    children: React.ReactNode
}) {
    const panel = useRef<HTMLDivElement>(null)
    const [opener] = useState(() => document.activeElement as HTMLElement | null)
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose

    useEffect(() => {
        const self = Symbol('dialog')
        openDialogs.push(self)

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
