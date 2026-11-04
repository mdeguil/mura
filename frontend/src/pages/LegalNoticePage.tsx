import { Link } from 'react-router-dom'
import LegalLayout, { LegalSection } from '../components/LegalLayout'
import { LEGAL_INFO } from '../legal/legalInfo'

/**
 * The mentions légales, at /mentions-legales (LCEN, art. 6-III). Mura is
 * software; what has to be declared is who publishes and hosts this
 * particular instance, which the instance supplies through
 * legal/legalInfo.ts. Only what it declared is shown -- never a placeholder
 * standing in for a name.
 */
export default function LegalNoticePage() {
    const { publisher, host } = LEGAL_INFO

    return (
        <LegalLayout title="Mentions légales">
            <LegalSection title="Éditeur">
                {publisher.name ? (
                    <>
                        <p>
                            Cette instance de Mura est éditée par{' '}
                            <strong className="text-slate-800">{publisher.name}</strong>
                            {publisher.address && <>, {publisher.address}</>}.
                        </p>
                        {publisher.email && (
                            <p>
                                Contact : <span className="text-slate-800">{publisher.email}</span>
                            </p>
                        )}
                        {publisher.publicationDirector && (
                            <p>
                                Directeur ou directrice de la publication :{' '}
                                <span className="text-slate-800">{publisher.publicationDirector}</span>
                            </p>
                        )}
                    </>
                ) : (
                    <p>
                        Mura s'installe chez ceux qui l'utilisent : chaque instance est éditée par la personne
                        ou l'organisation qui l'a installée. Celle-ci ne s'est pas déclarée.
                    </p>
                )}
            </LegalSection>

            <LegalSection title="Hébergement">
                {host.name ? (
                    <p>
                        Cette instance est hébergée par <strong className="text-slate-800">{host.name}</strong>
                        {host.address && <>, {host.address}</>}
                        {host.phone && <>, joignable au {host.phone}</>}.
                    </p>
                ) : (
                    <p>L'hébergeur de cette instance n'a pas été déclaré.</p>
                )}
            </LegalSection>

            <LegalSection title="Logiciel">
                <p>
                    Mura est un logiciel fait pour être installé par ceux qui l'utilisent. Il est libre
                    d'installation et d'utilisation, mais son code ne peut être ni modifié ni redistribué sans
                    l'accord de son auteur (licence Mura). Son auteur n'héberge aucune instance et n'a pas accès
                    à tes données. Les projets, tâches et autres contenus que tu y crées restent les tiens.
                </p>
            </LegalSection>

            <LegalSection title="Données personnelles">
                <p>
                    Ce que Mura fait de tes données, et comment exercer tes droits, est décrit dans la{' '}
                    <Link to="/confidentialite" className="text-brand-700 underline underline-offset-2">
                        politique de confidentialité
                    </Link>
                    .
                </p>
            </LegalSection>
        </LegalLayout>
    )
}
