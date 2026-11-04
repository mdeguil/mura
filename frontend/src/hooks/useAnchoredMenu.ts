import { useEffect, useRef, useState } from 'react'

/** Where an anchored menu goes, in viewport pixels. */
export type AnchoredPosition = {
    /** Distance from the top of the viewport. */
    top: number
    /** Distance from the left of the viewport. */
    left: number
    /** The menu's minimum width: its button's, or the hook's minimum. */
    width: number
    /** The tallest it may be before it scrolls. */
    maxHeight: number
}

/**
 * A menu hung off a button, laid out against the viewport rather than its
 * parent. Panels that scroll their own content -- the task modal, a list
 * of cards -- clip an absolutely positioned menu at their edge, and the
 * longer the menu the sooner it happens. Positioning it by hand costs a
 * measurement and buys a menu nothing can cut off. It opens downwards
 * unless there is plainly more room above, and follows its button on
 * scroll and resize. A click elsewhere or Escape closes it.
 *
 * @param options what the menu needs
 * @param options.open whether the menu is showing
 * @param options.onClose called on a click outside or Escape
 * @param options.minWidth the narrowest the menu may be, in pixels
 * @param options.maxHeight the tallest the menu may be, in pixels
 * @returns `wrapper` to put around button and menu, `trigger` to attach to
 *          the button, and the measured `position` -- null until the menu
 *          is open
 */
export function useAnchoredMenu({
    open,
    onClose,
    minWidth = 224,
    maxHeight = 256,
}: {
    open: boolean
    onClose: () => void
    minWidth?: number
    maxHeight?: number
}) {
    const wrapper = useRef<HTMLDivElement>(null)
    const trigger = useRef<HTMLButtonElement>(null)
    const [position, setPosition] = useState<AnchoredPosition | null>(null)

    useEffect(() => {
        if (!open) {
            setPosition(null)
            return
        }

        function place() {
            const rect = trigger.current?.getBoundingClientRect()
            if (!rect) return

            const gap = 6
            const margin = 12
            const below = window.innerHeight - rect.bottom - gap - margin
            const above = rect.top - gap - margin
            // Downwards unless there is plainly more room the other way.
            const dropDown = below >= Math.min(above, maxHeight - 16) || below >= above
            const height = Math.min(maxHeight, Math.max(dropDown ? below : above, 120))

            setPosition({
                top: dropDown ? rect.bottom + gap : rect.top - gap - height,
                left: Math.min(rect.left, window.innerWidth - minWidth - margin),
                width: Math.max(rect.width, minWidth),
                maxHeight: height,
            })
        }

        place()
        // The menu is anchored to a point in the viewport, so anything that
        // moves that point has to move it too.
        window.addEventListener('resize', place)
        window.addEventListener('scroll', place, true)

        function onPointerDown(event: MouseEvent) {
            if (!wrapper.current?.contains(event.target as Node)) onClose()
        }
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') onClose()
        }

        document.addEventListener('mousedown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)

        return () => {
            window.removeEventListener('resize', place)
            window.removeEventListener('scroll', place, true)
            document.removeEventListener('mousedown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open, onClose, minWidth, maxHeight])

    return { wrapper, trigger, position }
}

/**
 * The style that puts the menu where the hook measured it.
 *
 * @param position what useAnchoredMenu measured
 * @returns a fixed-position style for the menu
 */
export function anchoredStyle(position: AnchoredPosition): React.CSSProperties {
    return {
        position: 'fixed',
        top: position.top,
        left: position.left,
        minWidth: position.width,
        maxHeight: position.maxHeight,
    }
}
