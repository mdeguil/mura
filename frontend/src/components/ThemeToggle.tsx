import { useTranslation } from 'react-i18next'
import { useTheme } from '../hooks/useTheme'

/**
 * The button that switches between the dark and the light theme. It shows
 * where a click will take you rather than where you are: a sun in the
 * dark, a moon in the light.
 */
export default function ThemeToggle() {
    const { t } = useTranslation()
    const { theme, toggle } = useTheme()
    const label = theme === 'dark' ? t('theme.toLight') : t('theme.toDark')

    return (
        <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-surface-muted transition"
            title={label}
            aria-label={label}
        >
            <svg
                viewBox="0 0 24 24"
                className="w-[18px] h-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                {theme === 'dark' ? (
                    <>
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                    </>
                ) : (
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                )}
            </svg>
        </button>
    )
}
