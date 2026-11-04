import { Link } from 'react-router-dom'
import LegalLayout, { LegalSection } from '../components/LegalLayout'
import { LEGAL_INFO } from '../legal/legalInfo'

/**
 * The politique de confidentialité, at /confidentialite (RGPD, art. 13).
 * Every sentence here describes what the code actually does: when a
 * behaviour changes -- what is collected, who sees it, how long it stays --
 * this page changes with it.
 */
export default function PrivacyPage() {
    const { publisher, host, privacyContact } = LEGAL_INFO

    return (
        <LegalLayout title="Politique de confidentialité">
            <p>
                Cette page dit quelles données Mura conserve sur toi, pourquoi, qui peut les voir, combien de
                temps, et comment exercer tes droits.
            </p>

            <LegalSection title="Responsable du traitement">
                <p>
                    Mura s'installe chez ceux qui l'utilisent. Le responsable de tes données est la personne ou
                    l'organisation qui administre cette instance
                    {publisher.name ? (
                        <>
                            {' '}: <span className="text-slate-800">{publisher.name}</span>
                            {publisher.address && <>, {publisher.address}</>}
                        </>
                    ) : null}
                    . Les auteurs du logiciel n'y ont aucun accès.
                </p>
                <p>
                    Pour toute question sur tes données :{' '}
                    {privacyContact ? (
                        <span className="text-slate-800">{privacyContact}</span>
                    ) : (
                        "l'administrateur de cette instance"
                    )}
                    .
                </p>
            </LegalSection>

            <LegalSection title="Les données conservées">
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        <strong className="text-slate-800">Ton compte :</strong> nom d'utilisateur, adresse e-mail,
                        mot de passe (conservé haché, jamais en clair), date de création, date de vérification de
                        l'adresse.
                    </li>
                    <li>
                        <strong className="text-slate-800">Ce que tu fais dans Mura :</strong> projets, tâches,
                        sous-tâches et leur historique de statut, invitations envoyées et reçues, groupes, carnet de
                        contacts, notifications.
                    </li>
                </ul>
                <p>Mura ne demande rien d'autre : ni téléphone, ni date de naissance, ni adresse postale.</p>
            </LegalSection>

            <LegalSection title="Pourquoi">
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        Faire fonctionner le service : ton compte, le travail en équipe sur les projets, et les
                        e-mails qui l'accompagnent (code de vérification, lien de réinitialisation du mot de
                        passe, invitations, notifications). Base légale : l'exécution du service que tu as
                        demandé (RGPD, art. 6-1-b).
                    </li>
                    <li>
                        Protéger le service : vérifier qu'une adresse e-mail t'appartient, permettre à un
                        administrateur de suspendre un compte. Base légale : l'intérêt légitime de
                        l'administrateur de cette instance à en assurer la sécurité (RGPD, art. 6-1-f).
                    </li>
                </ul>
                <p>Tes données ne servent à aucune publicité, à aucun profilage, et ne sont ni vendues ni louées.</p>
            </LegalSection>

            <LegalSection title="Qui peut les voir">
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        Les membres des projets et des groupes que tu partages voient ton nom d'utilisateur et ton
                        adresse e-mail. Une personne seulement invitée sur un projet ne voit pas les adresses de
                        l'équipe.
                    </li>
                    <li>
                        Les administrateurs de cette instance voient la liste des comptes (nom, adresse, rôle, état) pour
                        pouvoir les gérer. Ils n'ont aucun accès aux projets dont ils ne sont pas membres.
                    </li>
                    <li>
                        L'hébergeur de cette instance
                        {host.name && (
                            <>
                                , <span className="text-slate-800">{host.name}</span>,
                            </>
                        )}{' '}
                        stocke les données pour le compte de son administrateur, et le service d'envoi d'e-mails
                        qu'il a choisi transmet les messages.
                    </li>
                </ul>
            </LegalSection>

            <LegalSection title="Combien de temps">
                <ul className="list-disc pl-5 space-y-1">
                    <li>Tes données sont conservées tant que ton compte existe.</li>
                    <li>
                        Quand tu supprimes ton compte, il est effacé aussitôt, avec tes invitations, tes
                        notifications, ton carnet et les groupes que tu gères. Un projet que tu partageais est
                        transmis à un autre de ses membres ; un projet où tu étais seul est supprimé. Les tâches
                        qui t'étaient confiées restent dans leur projet, sans ton nom.
                    </li>
                    <li>Une invitation sans réponse expire au bout de 14 jours.</li>
                    <li>Un lien de réinitialisation du mot de passe ne vaut qu'une heure et qu'une fois.</li>
                </ul>
            </LegalSection>

            <LegalSection title="Ce que Mura garde dans ton navigateur">
                <p>Mura ne dépose aucun cookie et ne fait appel à aucun service de mesure d'audience ou de publicité. Ton navigateur garde seulement :</p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        <code className="text-slate-800">mura-auth</code> : ce qui te garde connecté (valable 24
                        heures, vidé quand tu te déconnectes) ;
                    </li>
                    <li>
                        <code className="text-slate-800">mura-theme</code> : ton choix entre thème clair et thème
                        sombre.
                    </li>
                </ul>
                <p>
                    Les deux sont nécessaires au service que tu demandes : la loi ne demande pas ton consentement
                    pour eux.
                </p>
            </LegalSection>

            <LegalSection title="Tes droits">
                <p>
                    Tu peux à tout moment accéder à tes données, les faire corriger, les récupérer, les faire
                    effacer, t'opposer à leur usage ou en demander la limitation.
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li>
                        <strong className="text-slate-800">Récupérer tes données</strong> et{' '}
                        <strong className="text-slate-800">supprimer ton compte</strong> : directement depuis la
                        page{' '}
                        <Link to="/compte" className="text-brand-700 underline underline-offset-2">
                            Mon compte
                        </Link>
                        .
                    </li>
                    <li>
                        Pour tout le reste : écris à{' '}
                        {privacyContact ? (
                            <span className="text-slate-800">{privacyContact}</span>
                        ) : (
                            "l'administrateur de cette instance"
                        )}
                        . Une réponse t'est due dans un délai d'un mois.
                    </li>
                </ul>
                <p>
                    Si tu estimes que tes droits ne sont pas respectés, tu peux saisir la CNIL (
                    <a
                        href="https://www.cnil.fr/fr/plaintes"
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-700 underline underline-offset-2"
                    >
                        cnil.fr
                    </a>
                    ).
                </p>
            </LegalSection>

            <LegalSection title="Sécurité">
                <p>
                    Les mots de passe sont hachés avant d'être conservés, chaque adresse e-mail est vérifiée
                    avant usage, et un projet n'est visible que de ses membres.
                </p>
            </LegalSection>
        </LegalLayout>
    )
}
