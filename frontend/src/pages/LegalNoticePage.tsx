import { Link } from 'react-router-dom'
import { Trans, useTranslation } from 'react-i18next'
import LegalLayout, { LegalSection } from '../components/LegalLayout'
import { LEGAL_INFO } from '../legal/legalInfo'

const STRONG = { strong: <strong className="text-slate-800" /> }

/**
 * The mentions légales, at /mentions-legales (LCEN, art. 6-III). Mura is
 * software; what has to be declared is who publishes and hosts this
 * particular instance, which the instance supplies through
 * legal/legalInfo.ts. Only what it declared is shown -- never a placeholder
 * standing in for a name.
 */
export default function LegalNoticePage() {
    const { t } = useTranslation()
    const { publisher, host } = LEGAL_INFO

    return (
        <LegalLayout title={t('legal.notice.title')}>
            <LegalSection title={t('legal.notice.publisher')}>
                {publisher.name ? (
                    <>
                        <p>
                            <Trans
                                i18nKey="legal.notice.publishedBy"
                                values={{ name: publisher.name, address: publisher.address ? `, ${publisher.address}` : '' }}
                                components={STRONG}
                            />
                        </p>
                        {publisher.email && (
                            <p>
                                <Trans i18nKey="legal.notice.contact" values={{ email: publisher.email }} components={STRONG} />
                            </p>
                        )}
                        {publisher.publicationDirector && (
                            <p>
                                <Trans
                                    i18nKey="legal.notice.director"
                                    values={{ name: publisher.publicationDirector }}
                                    components={STRONG}
                                />
                            </p>
                        )}
                    </>
                ) : (
                    <p>{t('legal.notice.undeclaredPublisher')}</p>
                )}
            </LegalSection>

            <LegalSection title={t('legal.notice.hosting')}>
                {host.name ? (
                    <p>
                        <Trans
                            i18nKey="legal.notice.hostedBy"
                            values={{
                                name: host.name,
                                details:
                                    (host.address ? `, ${host.address}` : '') +
                                    (host.phone ? t('legal.notice.reachableAt', { phone: host.phone }) : ''),
                            }}
                            components={STRONG}
                        />
                    </p>
                ) : (
                    <p>{t('legal.notice.undeclaredHost')}</p>
                )}
            </LegalSection>

            <LegalSection title={t('legal.notice.software')}>
                <p>{t('legal.notice.softwareBody')}</p>
            </LegalSection>

            <LegalSection title={t('legal.notice.personalData')}>
                <p>
                    <Trans
                        i18nKey="legal.notice.personalDataBody"
                        components={{
                            anchor: <Link to="/confidentialite" className="text-brand-700 underline underline-offset-2" />,
                        }}
                    />
                </p>
            </LegalSection>
        </LegalLayout>
    )
}
