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
 * Two looks: `compact`, a switch in the top bar whose coloured thumb sits
 * under the language in use, so where you are is plain at a glance; and
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
        return (
            <div
                role="group"
                aria-label={t('language.choose')}
                className="relative grid grid-cols-2 h-8 w-[4.5rem] rounded-full bg-surface-muted border border-border p-0.5"
            >
                <span
                    aria-hidden="true"
                    className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-brand-500 shadow-sm transition-transform duration-200 ${
                        current === 'en' ? 'translate-x-full' : ''
                    }`}
                />
                {LANGUAGES.map((language) => (
                    <button
                        key={language}
                        type="button"
                        lang={language}
                        title={t(`language.${language}`)}
                        aria-label={t(`language.${language}`)}
                        aria-pressed={language === current}
                        onClick={() => void choose(language)}
                        className={`relative rounded-full text-[11px] font-semibold transition-colors ${
                            language === current ? 'text-ink' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {language.toUpperCase()}
                    </button>
                ))}
            </div>
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
