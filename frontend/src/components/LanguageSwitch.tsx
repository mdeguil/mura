import { useTranslation } from 'react-i18next'
import { currentLanguage, LANGUAGES, setLanguage, type Language } from '../i18n'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

/**
 * Shows the interface in a language and, for someone signed in, tells the
 * account too, so the mails and notifications they receive follow. The
 * account is told after the switch: the screen never waits on it, and if the
 * request fails the account simply catches up at the next sign-in.
 *
 * @param language the language to show
 */
async function choose(language: Language) {
    await setLanguage(language)
    if (!useAuthStore.getState().token) return
    try {
        await api.put('/auth/me/language', { language })
    } catch {
        return
    }
}

/**
 * Switches the interface between French and English. The choice is kept on
 * this device, like the theme, and on the account of whoever is signed in.
 *
 * Two looks: `compact`, one button in the top bar that shows the language a
 * click leads to (as the theme switch shows the theme it leads to); and
 * `list`, every language side by side in the footer, the current one marked.
 *
 * @param props which look to use
 */
export default function LanguageSwitch({
    variant,
}: {
    /** `compact` for the top bar, `list` for the footer. */
    variant: 'compact' | 'list'
}) {
    const { t } = useTranslation()
    const current = currentLanguage()

    if (variant === 'compact') {
        const next: Language = current === 'fr' ? 'en' : 'fr'
        const label = t('language.switchTo', { lng: next })
        return (
            <button
                type="button"
                onClick={() => void choose(next)}
                title={label}
                aria-label={label}
                lang={next}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold text-slate-500 hover:bg-surface-muted transition"
            >
                {next.toUpperCase()}
            </button>
        )
    }

    return (
        <div role="group" aria-label={t('language.choose')} className="flex items-center gap-1.5">
            {LANGUAGES.map((language, index) => (
                <span key={language} className="flex items-center gap-1.5">
                    {index > 0 && <span aria-hidden="true">|</span>}
                    <button
                        type="button"
                        lang={language}
                        aria-pressed={language === current}
                        onClick={() => void choose(language)}
                        className={
                            language === current
                                ? 'font-semibold text-slate-700'
                                : 'underline underline-offset-2 hover:text-slate-700'
                        }
                    >
                        {t(`language.${language}`)}
                    </button>
                </span>
            ))}
        </div>
    )
}
