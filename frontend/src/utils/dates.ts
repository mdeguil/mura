import { enGB, fr } from 'date-fns/locale'
import type { Locale } from 'date-fns'
import { currentLanguage } from '../i18n'

/**
 * The date-fns locale for the language on screen, for month and day names
 * and relative times ("dans 3 jours", "in 3 days"). English uses British
 * conventions, so a date reads day first in both languages and 05/11 means
 * the same day to everyone.
 *
 * @returns the locale to pass as `{ locale }` to date-fns
 */
export function dateLocale(): Locale {
    return currentLanguage() === 'en' ? enGB : fr
}
