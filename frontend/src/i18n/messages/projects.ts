/** Projects: their cards, header, status, editing, bin, members and invitations. */
export const fr = {
    projects: {
        status: {
            A_VENIR: 'À venir',
            EN_COURS: 'En cours',
            ACHEVE: 'Achevé',
        },
        role: {
            OWNER: 'Propriétaire',
            ADMIN: 'Administrateur',
            MEMBER: 'Membre',
        },
        card: {
            startDate: 'Date de début : {{date}}',
            completedOn: 'Achevé le {{date}}',
        },
        invited: {
            by: 'Invité par <strong>{{name}}</strong>',
            open: 'Voir le projet et répondre →',
            expires: 'Expire {{when}}',
            badge: 'Invitation',
        },
        header: {
            edit: 'Modifier',
            archiveHint: "Le projet quitte la liste de l'équipe, rien n'est perdu",
            archive: 'Archiver',
            changeStatus: 'Changer le statut du projet',
        },
        edit: {
            title: 'Modifier le projet',
            subtitle: 'Ces informations sont celles que voit toute l’équipe.',
            status: 'Statut',
            failed: 'Impossible d’enregistrer ces changements.',
        },
        bin: {
            restoreFailed: 'Impossible de restaurer ce projet.',
            empty: 'Aucun projet archivé.',
            emptyHint:
                'Les projets que tu archives atterrissent ici, et rien n’en est perdu tant que tu ne les supprimes pas.',
            restore: 'Restaurer',
            delete: 'Supprimer',
        },
        member: {
            roleOf: 'Rôle de {{name}}',
            remove: 'Retirer {{name}} du projet',
        },
        inviteMenu: {
            failed: "L'invitation n'a pas pu être envoyée.",
            title: 'Ajouter à un projet',
            label: 'Ajouter {{name}} à un projet',
            heading: 'Inviter {{name}} sur…',
            alreadyMember: 'déjà membre',
            invited: 'invité ✓',
        },
        groupAdd: {
            failed: "Ces personnes n'ont pas pu être ajoutées.",
            alreadyIn: 'Déjà dans le projet',
            hint: "Sans invitation : ils rejoignent l'équipe tout de suite, et en sont prévenus.",
            submit: 'Ajouter le groupe',
            submitting: 'Ajout…',
        },
        load: {
            project: 'Impossible de charger ce projet.',
            tasks: 'Impossible de charger les tâches.',
            archivedTasks: 'Impossible de charger les tâches archivées.',
            invitations: 'Impossible de charger les invitations du projet.',
            ownInvitation: 'Impossible de retrouver ton invitation.',
            types: 'Impossible de charger les types de projet.',
        },
    },
}

/** The same, in English. */
export const en: typeof fr = {
    projects: {
        status: {
            A_VENIR: 'Upcoming',
            EN_COURS: 'In progress',
            ACHEVE: 'Finished',
        },
        role: {
            OWNER: 'Owner',
            ADMIN: 'Administrator',
            MEMBER: 'Member',
        },
        card: {
            startDate: 'Start date: {{date}}',
            completedOn: 'Finished on {{date}}',
        },
        invited: {
            by: 'Invited by <strong>{{name}}</strong>',
            open: 'See the project and answer →',
            expires: 'Expires {{when}}',
            badge: 'Invitation',
        },
        header: {
            edit: 'Edit',
            archiveHint: "The project leaves the team's list; nothing is lost",
            archive: 'Archive',
            changeStatus: "Change the project's status",
        },
        edit: {
            title: 'Edit the project',
            subtitle: 'This is what the whole team sees.',
            status: 'Status',
            failed: 'These changes could not be saved.',
        },
        bin: {
            restoreFailed: 'This project could not be restored.',
            empty: 'No archived project.',
            emptyHint: 'The projects you archive land here, and nothing is lost until you delete them.',
            restore: 'Restore',
            delete: 'Delete',
        },
        member: {
            roleOf: "{{name}}'s role",
            remove: 'Remove {{name}} from the project',
        },
        inviteMenu: {
            failed: 'The invitation could not be sent.',
            title: 'Add to a project',
            label: 'Add {{name}} to a project',
            heading: 'Invite {{name}} to…',
            alreadyMember: 'already a member',
            invited: 'invited ✓',
        },
        groupAdd: {
            failed: 'These people could not be added.',
            alreadyIn: 'Already in the project',
            hint: 'No invitation: they join the team straight away, and are told.',
            submit: 'Add the group',
            submitting: 'Adding…',
        },
        load: {
            project: 'This project could not be loaded.',
            tasks: 'The tasks could not be loaded.',
            archivedTasks: 'The archived tasks could not be loaded.',
            invitations: "The project's invitations could not be loaded.",
            ownInvitation: 'Your invitation could not be found.',
            types: 'The project types could not be loaded.',
        },
    },
}
