import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitch from './LanguageSwitch'

/** Where Mura itself is presented, linked from the foot of every page. */
export const MURA_WEBSITE = 'https://mura.novadev-studio.fr'

/**
 * The foot of every screen: under the sign-in and signup cards, and at the
 * bottom of every page once signed in. It carries the legal pages, which the
 * law asks to be easy to find rather than tucked into a menu, the link to
 * Mura's website, and the language switch, so it can be changed before
 * signing in.
 *
 * @param props where to place them
 */
export default function LegalLinks({
    className = '',
}: {
    /** Classes for spacing around the links. */
    className?: string
}) {
    const { t } = useTranslation()

    return (
        <div className={`flex flex-col items-center gap-2 text-xs text-slate-500 ${className}`}>
            <nav aria-label={t('footer.label')} className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
                <Link to="/mentions-legales" className="underline underline-offset-2 hover:text-slate-700">
                    {t('footer.legalNotice')}
                </Link>
                <span aria-hidden="true">·</span>
                <Link to="/confidentialite" className="underline underline-offset-2 hover:text-slate-700">
                    {t('footer.privacy')}
                </Link>
                <span aria-hidden="true">·</span>
                <a
                    href={MURA_WEBSITE}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t('footer.website')}
                    className="underline underline-offset-2 hover:text-slate-700"
                >
                    mura.novadev-studio.fr
                </a>
            </nav>
            <LanguageSwitch variant="list" />
        </div>
    )
}
