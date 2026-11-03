import { Link } from 'react-router-dom'
import LegalLayout, { LegalSection } from '../components/LegalLayout'
import { LEGAL_INFO } from '../legal/legalInfo'

// Mentions légales: who publishes the service and who hosts it (LCEN,
// art. 6-III). The facts themselves live in legal/legalInfo.ts.
export default function LegalNoticePage() {
    const { publisher, host } = LEGAL_INFO

    return (
        <LegalLayout title="Mentions légales">
            <LegalSection title="Éditeur">
                <p>
                    Mura est édité par <strong className="text-slate-800">{publisher.name}</strong>,{' '}
                    {publisher.address}.
                </p>
                <p>
                    Contact : <span className="text-slate-800">{publisher.email}</span>
                </p>
                <p>
                    Directeur ou directrice de la publication :{' '}
                    <span className="text-slate-800">{publisher.publicationDirector}</span>
                </p>
            </LegalSection>

            <LegalSection title="Hébergement">
                <p>
                    Mura est hébergé par <strong className="text-slate-800">{host.name}</strong>, {host.address},
                    joignable au {host.phone}.
                </p>
            </LegalSection>

            <LegalSection title="Logiciel">
                <p>
                    Mura est un logiciel libre, distribué sous licence MIT. Les projets, tâches et autres
                    contenus que tu y crées restent les tiens.
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
