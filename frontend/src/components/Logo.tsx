import logoOnLight from '../assets/logo-on-light.png'
import logoOnDark from '../assets/logo-on-dark.png'

/**
 * Mura's mark, in the version that stands out on the current theme: the
 * dark disc on light pages, the same M on a light disc on dark ones. Both
 * are in the page and CSS shows one, so switching theme swaps them at once
 * with nothing to re-render. The hidden one is display:none, which screen
 * readers skip as well.
 *
 * @param props its size and its text alternative
 */
export default function Logo({
    className = '',
    alt = 'Mura',
}: {
    /** Classes for its size, applied to both versions. */
    className?: string
    /** Its text alternative; `''` when the name is written beside it. */
    alt?: string
}) {
    return (
        <>
            <img src={logoOnLight} alt={alt} className={`${className} dark:hidden`} />
            <img src={logoOnDark} alt={alt} className={`${className} hidden dark:block`} />
        </>
    )
}
