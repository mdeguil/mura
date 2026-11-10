/**
 * The legal notice and the privacy policy. Every sentence describes what the
 * code does: when a behaviour changes, both languages change with it.
 */
export const fr = {
    legal: {
        theAdministrator: "l'administrateur de cette instance",
        notice: {
            title: 'Mentions légales',
            publisher: 'Éditeur',
            publishedBy: 'Cette instance de Mura est éditée par <strong>{{name}}</strong>{{address}}.',
            contact: 'Contact : <strong>{{email}}</strong>',
            director: 'Directeur ou directrice de la publication : <strong>{{name}}</strong>',
            undeclaredPublisher:
                "Mura s'installe chez ceux qui l'utilisent : chaque instance est éditée par la personne ou l'organisation qui l'a installée. Celle-ci ne s'est pas déclarée.",
            hosting: 'Hébergement',
            hostedBy: 'Cette instance est hébergée par <strong>{{name}}</strong>{{details}}.',
            reachableAt: ', joignable au {{phone}}',
            undeclaredHost: "L'hébergeur de cette instance n'a pas été déclaré.",
            software: 'Logiciel',
            softwareBody:
                "Mura est un logiciel fait pour être installé par ceux qui l'utilisent. Il est libre d'installation et d'utilisation, mais son code ne peut être ni modifié ni redistribué sans l'accord de son auteur (licence Mura). Son auteur n'héberge aucune instance et n'a pas accès à tes données. Les projets, tâches et autres contenus que tu y crées restent les tiens.",
            personalData: 'Données personnelles',
            personalDataBody:
                'Ce que Mura fait de tes données, et comment exercer tes droits, est décrit dans la <anchor>politique de confidentialité</anchor>.',
        },
        privacy: {
            title: 'Politique de confidentialité',
            intro: 'Cette page dit quelles données Mura conserve sur toi, pourquoi, qui peut les voir, combien de temps, et comment exercer tes droits.',
            controller: 'Responsable du traitement',
            controllerBody:
                "Mura s'installe chez ceux qui l'utilisent. Le responsable de tes données est la personne ou l'organisation qui administre cette instance{{who}}. Les auteurs du logiciel n'y ont aucun accès.",
            controllerNamed: ' : <strong>{{name}}</strong>',
            questions: 'Pour toute question sur tes données : <strong>{{contact}}</strong>.',
            kept: 'Les données conservées',
            keptAccount:
                "<strong>Ton compte :</strong> nom d'utilisateur, adresse e-mail, mot de passe (conservé haché, jamais en clair), langue de l'interface, date de création, date de vérification de l'adresse.",
            keptActivity:
                '<strong>Ce que tu fais dans Mura :</strong> projets, tâches, sous-tâches et leur historique de statut, invitations envoyées et reçues, groupes, carnet de contacts, notifications.',
            keptNothingElse: 'Mura ne demande rien d’autre : ni téléphone, ni date de naissance, ni adresse postale.',
            why: 'Pourquoi',
            whyService:
                "Faire fonctionner le service : ton compte, le travail en équipe sur les projets, et les e-mails qui l'accompagnent (code de vérification, lien de réinitialisation du mot de passe, invitations, notifications). Base légale : l'exécution du service que tu as demandé (RGPD, art. 6-1-b).",
            whySecurity:
                "Protéger le service : vérifier qu'une adresse e-mail t'appartient, permettre à un administrateur de suspendre un compte. Base légale : l'intérêt légitime de l'administrateur de cette instance à en assurer la sécurité (RGPD, art. 6-1-f).",
            whyNot: 'Tes données ne servent à aucune publicité, à aucun profilage, et ne sont ni vendues ni louées.',
            who: 'Qui peut les voir',
            whoMembers:
                "Les membres des projets et des groupes que tu partages voient ton nom d'utilisateur et ton adresse e-mail. Une personne seulement invitée sur un projet ne voit pas les adresses de l'équipe.",
            whoAdmins:
                "Les administrateurs de cette instance voient la liste des comptes (nom, adresse, rôle, état) pour pouvoir les gérer. Ils n'ont aucun accès aux projets dont ils ne sont pas membres.",
            whoHost:
                "L'hébergeur de cette instance{{host}} stocke les données pour le compte de son administrateur, et le service d'envoi d'e-mails qu'il a choisi transmet les messages.",
            whoHostNamed: ', <strong>{{name}}</strong>,',
            howLong: 'Combien de temps',
            howLongAccount: 'Tes données sont conservées tant que ton compte existe.',
            howLongDeletion:
                "Quand tu supprimes ton compte, il est effacé aussitôt, avec tes invitations, tes notifications, ton carnet et les groupes que tu gères. Un projet que tu partageais est transmis à un autre de ses membres ; un projet où tu étais seul est supprimé. Les tâches qui t'étaient confiées restent dans leur projet, sans ton nom.",
            howLongInvitation: 'Une invitation sans réponse expire au bout de 14 jours.',
            howLongReset: "Un lien de réinitialisation du mot de passe ne vaut qu'une heure et qu'une fois.",
            browser: 'Ce que Mura garde dans ton navigateur',
            browserIntro:
                "Mura ne dépose aucun cookie et ne fait appel à aucun service de mesure d'audience ou de publicité. Ton navigateur garde seulement :",
            browserAuth: '<code>mura-auth</code> : ce qui te garde connecté (valable 24 heures, vidé quand tu te déconnectes) ;',
            browserTheme: '<code>mura-theme</code> : ton choix entre thème clair et thème sombre ;',
            browserLang: "<code>mura-lang</code> : la langue de l'interface, français ou anglais.",
            browserConsent:
                'Les trois sont nécessaires au service que tu demandes : la loi ne demande pas ton consentement pour eux.',
            rights: 'Tes droits',
            rightsIntro:
                "Tu peux à tout moment accéder à tes données, les faire corriger, les récupérer, les faire effacer, t'opposer à leur usage ou en demander la limitation.",
            rightsSelf:
                '<strong>Récupérer tes données</strong> et <strong>supprimer ton compte</strong> : directement depuis la page <anchor>Mon compte</anchor>.',
            rightsOther: "Pour tout le reste : écris à <strong>{{contact}}</strong>. Une réponse t'est due dans un délai d'un mois.",
            rightsCnil: 'Si tu estimes que tes droits ne sont pas respectés, tu peux saisir la CNIL (<cnil>cnil.fr</cnil>).',
            security: 'Sécurité',
            securityBody:
                "Les mots de passe sont hachés avant d'être conservés, chaque adresse e-mail est vérifiée avant usage, et un projet n'est visible que de ses membres.",
        },
    },
}

/** The same, in English. */
export const en: typeof fr = {
    legal: {
        theAdministrator: 'the administrator of this instance',
        notice: {
            title: 'Legal notice',
            publisher: 'Publisher',
            publishedBy: 'This Mura instance is published by <strong>{{name}}</strong>{{address}}.',
            contact: 'Contact: <strong>{{email}}</strong>',
            director: 'Director of publication: <strong>{{name}}</strong>',
            undeclaredPublisher:
                'Mura is installed by the people who use it: each instance is published by the person or organisation that installed it. This one has not declared itself.',
            hosting: 'Hosting',
            hostedBy: 'This instance is hosted by <strong>{{name}}</strong>{{details}}.',
            reachableAt: ', reachable on {{phone}}',
            undeclaredHost: 'The host of this instance has not been declared.',
            software: 'Software',
            softwareBody:
                'Mura is software made to be installed by the people who use it. It is free to install and use, but its code may not be modified or redistributed without its author’s permission (Mura licence). Its author hosts no instance and has no access to your data. The projects, tasks and other content you create in it remain yours.',
            personalData: 'Personal data',
            personalDataBody:
                'What Mura does with your data, and how to exercise your rights, is described in the <anchor>privacy policy</anchor>.',
        },
        privacy: {
            title: 'Privacy policy',
            intro: 'This page says what data Mura keeps about you, why, who can see it, for how long, and how to exercise your rights.',
            controller: 'Data controller',
            controllerBody:
                'Mura is installed by the people who use it. The controller of your data is the person or organisation that runs this instance{{who}}. The software’s authors have no access to it.',
            controllerNamed: ': <strong>{{name}}</strong>',
            questions: 'For any question about your data: <strong>{{contact}}</strong>.',
            kept: 'The data kept',
            keptAccount:
                '<strong>Your account:</strong> username, email address, password (stored hashed, never in clear), interface language, creation date, date the address was confirmed.',
            keptActivity:
                '<strong>What you do in Mura:</strong> projects, tasks, subtasks and their status history, invitations sent and received, groups, address book, notifications.',
            keptNothingElse: 'Mura asks for nothing else: no phone number, no date of birth, no postal address.',
            why: 'Why',
            whyService:
                'Running the service: your account, teamwork on projects, and the emails that go with it (verification code, password reset link, invitations, notifications). Legal basis: performing the service you asked for (GDPR, art. 6(1)(b)).',
            whySecurity:
                "Protecting the service: checking that an email address is yours, letting an administrator suspend an account. Legal basis: the legitimate interest of this instance's administrator in keeping it secure (GDPR, art. 6(1)(f)).",
            whyNot: 'Your data is used for no advertising and no profiling, and is neither sold nor rented.',
            who: 'Who can see it',
            whoMembers:
                'The members of the projects and groups you share see your username and your email address. Someone only invited to a project does not see the team’s addresses.',
            whoAdmins:
                'The administrators of this instance see the list of accounts (name, address, role, state) so they can manage them. They have no access to the projects they are not a member of.',
            whoHost:
                'The host of this instance{{host}} stores the data on behalf of its administrator, and the email service they chose carries the messages.',
            whoHostNamed: ', <strong>{{name}}</strong>,',
            howLong: 'For how long',
            howLongAccount: 'Your data is kept as long as your account exists.',
            howLongDeletion:
                'When you delete your account, it is erased at once, along with your invitations, your notifications, your address book and the groups you run. A project you shared goes to another of its members; a project where you were alone is deleted. The tasks given to you stay in their project, without your name.',
            howLongInvitation: 'An unanswered invitation expires after 14 days.',
            howLongReset: 'A password reset link works for one hour, and only once.',
            browser: 'What Mura keeps in your browser',
            browserIntro: 'Mura sets no cookie and uses no audience measurement or advertising service. Your browser only keeps:',
            browserAuth: '<code>mura-auth</code>: what keeps you signed in (valid for 24 hours, cleared when you sign out);',
            browserTheme: '<code>mura-theme</code>: your choice between the light and the dark theme;',
            browserLang: '<code>mura-lang</code>: the interface language, French or English.',
            browserConsent: 'All three are needed for the service you ask for: the law does not require your consent for them.',
            rights: 'Your rights',
            rightsIntro:
                'You can at any time access your data, have it corrected, get a copy, have it erased, object to its use or ask for it to be restricted.',
            rightsSelf:
                '<strong>Getting your data</strong> and <strong>deleting your account</strong>: straight from the <anchor>My account</anchor> page.',
            rightsOther: 'For anything else: write to <strong>{{contact}}</strong>. You are owed an answer within one month.',
            rightsCnil:
                'If you feel your rights are not respected, you can complain to the CNIL, the French data protection authority (<cnil>cnil.fr</cnil>).',
            security: 'Security',
            securityBody:
                'Passwords are hashed before they are stored, every email address is checked before it is used, and a project is visible to its members only.',
        },
    },
}
