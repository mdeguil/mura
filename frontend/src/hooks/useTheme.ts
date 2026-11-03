import { useState } from 'react'

export type Theme = 'dark' | 'light'

// Where the choice is kept, and the key index.html reads before the first
// paint: the two must agree.
const STORAGE_KEY = 'mura-theme'

// The theme lives on <html data-theme>, set once by index.html; this only
// reads it and changes it. Kept per device, not per account: it is about the
// screen in front of you.
export function useTheme() {
    const [theme, setTheme] = useState<Theme>(() =>
        document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
    )

    function toggle() {
        const next: Theme = theme === 'dark' ? 'light' : 'dark'
        document.documentElement.dataset.theme = next
        // Unavailable storage only means the choice will not be remembered.
        try {
            localStorage.setItem(STORAGE_KEY, next)
        } catch {
            // nothing to do
        }
        setTheme(next)
    }

    return { theme, toggle }
}
