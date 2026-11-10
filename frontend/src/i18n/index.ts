import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fr, { type Messages } from './fr'
import en from './en'

/** The languages the interface is written in. */
export type Language = 'fr' | 'en'

/** Every language, in the order the switch shows them. */
export const LANGUAGES: Language[] = ['fr', 'en']

const STORAGE_KEY = 'mura-lang'

declare module 'i18next' {
    interface CustomTypeOptions {
        defaultNS: 'translation'
        resources: { translation: Messages }
    }
}

/**
 * The language to open in: the one this device chose last, otherwise
 * French for a browser set to French and English for any other. Storage can
 * be unavailable (private windows, blocked site data); the browser's
 * language is the answer then.
 *
 * @returns the language to start with
 */
export function initialLanguage(): Language {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored === 'fr' || stored === 'en') {
            return stored
        }
    } catch {
        return browserLanguage()
    }
    return browserLanguage()
}

function browserLanguage(): Language {
    return navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

/**
 * The language on screen right now.
 *
 * @returns `fr` or `en`
 */
export function currentLanguage(): Language {
    return i18n.language === 'en' ? 'en' : 'fr'
}

/**
 * Switches the interface to a language and remembers it on this device. The
 * page's `lang` attribute follows, so screen readers pronounce the text in
 * the right language.
 *
 * @param language the language to show
 * @returns once every component has the new texts
 */
export async function setLanguage(language: Language): Promise<void> {
    await i18n.changeLanguage(language)
    try {
        localStorage.setItem(STORAGE_KEY, language)
    } catch {
        return
    }
}

void i18n.use(initReactI18next).init({
    resources: { fr: { translation: fr }, en: { translation: en } },
    lng: initialLanguage(),
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
    returnNull: false,
})

document.documentElement.lang = currentLanguage()
i18n.on('languageChanged', () => {
    document.documentElement.lang = currentLanguage()
})

export default i18n
