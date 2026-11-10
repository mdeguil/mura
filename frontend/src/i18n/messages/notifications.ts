/**
 * The bell. Each line is a whole sentence with the names marked `<b>`, so
 * each language can put them where its grammar wants.
 */
export const fr = {
    notifications: {
        title: 'Notifications',
        unread_one: 'Notifications : {{count}} non lue',
        unread_other: 'Notifications : {{count}} non lues',
        empty: 'Rien de neuf pour le moment.',
        clickToRead: 'Clic pour marquer comme lu',
        clickToReadOrOpen: 'Clic pour marquer comme lu, double-clic pour ouvrir {{target}}',
        doubleClickToSee: ' · double-clic pour voir {{target}}',
        removeInvitation: "Retirer de la cloche (l'invitation reste dans tes projets)",
        delete: 'Supprimer la notification',
        target: {
            project: 'le projet',
            carnet: 'le carnet',
            group: 'le groupe',
        },
        invitation: "<b>{{actor}}</b> t'invite à rejoindre <b>{{name}}</b>",
        line: {
            REMOVED_FROM_PROJECT: "<b>{{actor}}</b> t'a retiré de <b>{{name}}</b>",
            ADDED_TO_PROJECT: "<b>{{actor}}</b> t'a ajouté à <b>{{name}}</b>",
            MEMBER_LEFT_PROJECT: '<b>{{actor}}</b> a quitté <b>{{name}}</b>',
            MEMBER_SUSPENDED_project: 'Le compte de <b>{{actor}}</b> a été suspendu — il est sur ton projet <b>{{name}}</b>',
            MEMBER_SUSPENDED_group: 'Le compte de <b>{{actor}}</b> a été suspendu — il est dans ton groupe <b>{{name}}</b>',
            MEMBER_RESTORED_project:
                'Le compte de <b>{{actor}}</b> est de nouveau actif — il est sur ton projet <b>{{name}}</b>',
            MEMBER_RESTORED_group:
                'Le compte de <b>{{actor}}</b> est de nouveau actif — il est dans ton groupe <b>{{name}}</b>',
            MEMBER_DELETED_project: 'Le compte de <b>{{actor}}</b> a été supprimé — il était sur ton projet <b>{{name}}</b>',
            MEMBER_DELETED_group: 'Le compte de <b>{{actor}}</b> a été supprimé — il était dans ton groupe <b>{{name}}</b>',
            CONTACT_REQUESTED: '<b>{{actor}}</b> aimerait t’ajouter à son carnet',
            CONTACT_ACCEPTED: '<b>{{actor}}</b> a accepté ta demande de contact',
            GROUP_ENTRUSTED: '<b>{{actor}}</b> t’a confié la gestion du groupe <b>{{name}}</b>',
            GROUP_MANAGER_CHANGED: 'Le groupe <b>{{name}}</b> est désormais géré par <b>{{actor}}</b>',
            GROUP_DELETED: '<b>{{actor}}</b> a supprimé le groupe <b>{{name}}</b>',
            ADDED_TO_GROUP: '<b>{{actor}}</b> t’a ajouté au groupe <b>{{name}}</b>',
            REMOVED_FROM_GROUP: '<b>{{actor}}</b> t’a retiré du groupe <b>{{name}}</b>',
            MEMBER_LEFT_GROUP: '<b>{{actor}}</b> a quitté ton groupe <b>{{name}}</b>',
            HELD_IN_GROUP: '<b>{{actor}}</b> t’a mis en retrait du groupe <b>{{name}}</b>',
            RESTORED_IN_GROUP: '<b>{{actor}}</b> a levé ton retrait du groupe <b>{{name}}</b>',
        },
    },
}

/** The same, in English. */
export const en: typeof fr = {
    notifications: {
        title: 'Notifications',
        unread_one: 'Notifications: {{count}} unread',
        unread_other: 'Notifications: {{count}} unread',
        empty: 'Nothing new for now.',
        clickToRead: 'Click to mark as read',
        clickToReadOrOpen: 'Click to mark as read, double-click to open {{target}}',
        doubleClickToSee: ' · double-click to see {{target}}',
        removeInvitation: 'Remove from the bell (the invitation stays in your projects)',
        delete: 'Delete the notification',
        target: {
            project: 'the project',
            carnet: 'your contacts',
            group: 'the group',
        },
        invitation: '<b>{{actor}}</b> invites you to join <b>{{name}}</b>',
        line: {
            REMOVED_FROM_PROJECT: '<b>{{actor}}</b> removed you from <b>{{name}}</b>',
            ADDED_TO_PROJECT: '<b>{{actor}}</b> added you to <b>{{name}}</b>',
            MEMBER_LEFT_PROJECT: '<b>{{actor}}</b> left <b>{{name}}</b>',
            MEMBER_SUSPENDED_project: "<b>{{actor}}</b>'s account was suspended — they are on your project <b>{{name}}</b>",
            MEMBER_SUSPENDED_group: "<b>{{actor}}</b>'s account was suspended — they are in your group <b>{{name}}</b>",
            MEMBER_RESTORED_project: "<b>{{actor}}</b>'s account is active again — they are on your project <b>{{name}}</b>",
            MEMBER_RESTORED_group: "<b>{{actor}}</b>'s account is active again — they are in your group <b>{{name}}</b>",
            MEMBER_DELETED_project: "<b>{{actor}}</b>'s account was deleted — they were on your project <b>{{name}}</b>",
            MEMBER_DELETED_group: "<b>{{actor}}</b>'s account was deleted — they were in your group <b>{{name}}</b>",
            CONTACT_REQUESTED: '<b>{{actor}}</b> would like to add you to their contacts',
            CONTACT_ACCEPTED: '<b>{{actor}}</b> accepted your contact request',
            GROUP_ENTRUSTED: '<b>{{actor}}</b> made you the manager of the group <b>{{name}}</b>',
            GROUP_MANAGER_CHANGED: 'The group <b>{{name}}</b> is now run by <b>{{actor}}</b>',
            GROUP_DELETED: '<b>{{actor}}</b> deleted the group <b>{{name}}</b>',
            ADDED_TO_GROUP: '<b>{{actor}}</b> added you to the group <b>{{name}}</b>',
            REMOVED_FROM_GROUP: '<b>{{actor}}</b> removed you from the group <b>{{name}}</b>',
            MEMBER_LEFT_GROUP: '<b>{{actor}}</b> left your group <b>{{name}}</b>',
            HELD_IN_GROUP: '<b>{{actor}}</b> put you on hold in the group <b>{{name}}</b>',
            RESTORED_IN_GROUP: '<b>{{actor}}</b> lifted your hold in the group <b>{{name}}</b>',
        },
    },
}
