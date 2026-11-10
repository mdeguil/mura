import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import LegalLayout, { LegalSection } from '../components/LegalLayout'
import { LEGAL_INFO } from '../legal/legalInfo'

const STRONG = { strong: <strong className="text-slate-800" /> }

/**
 * The politique de confidentialité, at /confidentialite (RGPD, art. 13).
 * Every sentence here describes what the code actually does: when a
 * behaviour changes -- what is collected, who sees it, how long it stays --
 * this page changes with it, in both languages.
 */
export default function PrivacyPage() {
    const { t } = useTranslation()
    const { publisher, host, privacyContact } = LEGAL_INFO
    const contact = privacyContact ?? t('legal.theAdministrator')
    const controllerName = publisher.name
        ? publisher.name + (publisher.address ? `, ${publisher.address}` : '')
        : null

    return (
        <LegalLayout title={t('legal.privacy.title')}>
            <p>{t('legal.privacy.intro')}</p>

            <LegalSection title={t('legal.privacy.controller')}>
                <p>
                    <Trans
                        i18nKey="legal.privacy.controllerBody"
                        values={{
                            who: controllerName ? t('legal.privacy.controllerNamed', { name: controllerName }) : '',
                        }}
                        components={STRONG}
                    />
                </p>
                <p>
                    {privacyContact ? (
                        <Trans i18nKey="legal.privacy.questions" values={{ contact }} components={STRONG} />
                    ) : (
                        <Trans i18nKey="legal.privacy.questions" values={{ contact }} components={{ strong: <span /> }} />
                    )}
                </p>
            </LegalSection>

            <LegalSection title={t('legal.privacy.kept')}>
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        <Trans i18nKey="legal.privacy.keptAccount" components={STRONG} />
                    </li>
                    <li>
                        <Trans i18nKey="legal.privacy.keptActivity" components={STRONG} />
                    </li>
                </ul>
                <p>{t('legal.privacy.keptNothingElse')}</p>
            </LegalSection>

            <LegalSection title={t('legal.privacy.why')}>
                <ul className="list-disc pl-5 space-y-1">
                    <li>{t('legal.privacy.whyService')}</li>
                    <li>{t('legal.privacy.whySecurity')}</li>
                </ul>
                <p>{t('legal.privacy.whyNot')}</p>
            </LegalSection>

            <LegalSection title={t('legal.privacy.who')}>
                <ul className="list-disc pl-5 space-y-1">
                    <li>{t('legal.privacy.whoMembers')}</li>
                    <li>{t('legal.privacy.whoAdmins')}</li>
                    <li>
                        <Trans
                            i18nKey="legal.privacy.whoHost"
                            values={{ host: host.name ? t('legal.privacy.whoHostNamed', { name: host.name }) : '' }}
                            components={STRONG}
                        />
                    </li>
                </ul>
            </LegalSection>

            <LegalSection title={t('legal.privacy.howLong')}>
                <ul className="list-disc pl-5 space-y-1">
                    <li>{t('legal.privacy.howLongAccount')}</li>
                    <li>{t('legal.privacy.howLongDeletion')}</li>
                    <li>{t('legal.privacy.howLongInvitation')}</li>
                    <li>{t('legal.privacy.howLongReset')}</li>
                </ul>
            </LegalSection>

            <LegalSection title={t('legal.privacy.browser')}>
                <p>{t('legal.privacy.browserIntro')}</p>
                <ul className="list-disc pl-5 space-y-1">
                    {(['browserAuth', 'browserTheme', 'browserLang'] as const).map((key) => (
                        <li key={key}>
                            <Trans i18nKey={`legal.privacy.${key}`} components={{ code: <code className="text-slate-800" /> }} />
                        </li>
                    ))}
                </ul>
                <p>{t('legal.privacy.browserConsent')}</p>
            </LegalSection>

            <LegalSection title={t('legal.privacy.rights')}>
                <p>{t('legal.privacy.rightsIntro')}</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        <Trans
                            i18nKey="legal.privacy.rightsSelf"
                            components={{
                                ...STRONG,
                                anchor: <Link to="/compte" className="text-brand-700 underline underline-offset-2" />,
                            }}
                        />
                    </li>
                    <li>
                        {privacyContact ? (
                            <Trans i18nKey="legal.privacy.rightsOther" values={{ contact }} components={STRONG} />
                        ) : (
                            <Trans i18nKey="legal.privacy.rightsOther" values={{ contact }} components={{ strong: <span /> }} />
                        )}
                    </li>
                </ul>
                <p>
                    <Trans
                        i18nKey="legal.privacy.rightsCnil"
                        components={{
                            cnil: (
                                <a
                                    href="https://www.cnil.fr/fr/plaintes"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-brand-700 underline underline-offset-2"
                                />
                            ),
                        }}
                    />
                </p>
            </LegalSection>

            <LegalSection title={t('legal.privacy.security')}>
                <p>{t('legal.privacy.securityBody')}</p>
            </LegalSection>
        </LegalLayout>
    )
}
