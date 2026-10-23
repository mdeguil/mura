package io.mura.notification;

// What a notification says, in one place, so the bell and the mail cannot
// drift into telling the same person two different things.
final class NotificationWording {

    record Lines(String subject, String heading, String sentence, String linkPath, String linkLabel) {}

    private NotificationWording() {}

    static Lines of(Notification notification) {
        String who = notification.getActorName();
        String name = notification.getProjectName() != null
                ? notification.getProjectName()
                : notification.getGroupName();
        // The same news reaches a group owner and a project owner, so the
        // line has to say which of theirs it is about.
        String where = notification.getGroupName() != null
                ? "dans ton groupe " + notification.getGroupName()
                : "sur ton projet " + notification.getProjectName();

        // Where the mail should take them. News about a group belongs to
        // the carnet; a project they were removed from is no longer theirs
        // to open, so that one lands on the list.
        boolean aboutGroup = notification.getGroupName() != null;
        String destination = aboutGroup
                ? notification.getGroup() == null
                        ? "/carnet"
                        : "/groupe/" + notification.getGroup().getId()
                : notification.getProject() == null
                        ? "/projets"
                        : "/project/" + notification.getProject().getId();
        String open = aboutGroup
                ? notification.getGroup() == null ? "Ouvrir le carnet" : "Ouvrir le groupe"
                : "Ouvrir le projet";

        return switch (notification.getType()) {
            case REMOVED_FROM_PROJECT -> new Lines(
                    who + " t'a retiré de " + name,
                    "Tu ne fais plus partie de " + name,
                    who + " t'a retiré du projet " + name + ".",
                    "/projets", "Voir mes projets"
            );
            case MEMBER_LEFT_PROJECT -> new Lines(
                    who + " a quitté " + name,
                    who + " a quitté " + name,
                    who + " a quitté le projet " + name + ", que tu gères.",
                    destination, open
            );
            case MEMBER_SUSPENDED -> new Lines(
                    "Le compte de " + who + " a été suspendu",
                    "Le compte de " + who + " a été suspendu",
                    "Le compte de " + who + " a été suspendu — il est " + where
                            + ". Il ne pourra plus se connecter jusqu'à nouvel ordre.",
                    destination, open
            );
            case MEMBER_RESTORED -> new Lines(
                    "Le compte de " + who + " est réactivé",
                    "Le compte de " + who + " est de nouveau actif",
                    "Le compte de " + who + " est de nouveau actif — il est " + where + ".",
                    destination, open
            );
            case MEMBER_DELETED -> new Lines(
                    "Le compte de " + who + " a été supprimé",
                    "Le compte de " + who + " a été supprimé",
                    "Le compte de " + who + " a été supprimé — il était " + where + ".",
                    destination, open
            );
            case CONTACT_REQUESTED -> new Lines(
                    who + " aimerait t'ajouter à son carnet",
                    "Une demande de contact",
                    who + " aimerait t'ajouter à son carnet. Tu peux accepter ou refuser "
                            + "depuis ton carnet.",
                    "/carnet", "Répondre"
            );
            case CONTACT_ACCEPTED -> new Lines(
                    who + " a accepté ta demande de contact",
                    "Demande acceptée",
                    who + " a accepté ta demande de contact. Vous êtes maintenant dans le carnet "
                            + "l'un de l'autre.",
                    "/carnet", "Voir mon carnet"
            );
            case GROUP_ENTRUSTED -> new Lines(
                    "Tu gères le groupe " + name,
                    "Le groupe " + name + " est à toi",
                    who + " t'a confié la gestion du groupe " + name
                            + ". À toi d'y ajouter ou d'en retirer des personnes.",
                    destination, open
            );
            case GROUP_MANAGER_CHANGED -> new Lines(
                    "Le groupe " + name + " change de gérant",
                    "Le groupe " + name + " est désormais géré par " + who,
                    "La gestion du groupe " + name + " a été confiée à " + who
                            + ". Tu en restes membre.",
                    destination, open
            );
            case GROUP_DELETED -> new Lines(
                    "Le groupe " + name + " a été supprimé",
                    "Le groupe " + name + " a été supprimé",
                    who + " a supprimé le groupe " + name
                            + ". Les personnes qui en faisaient partie ne sont pas touchées.",
                    "/carnet", "Ouvrir le carnet"
            );
            case ADDED_TO_GROUP -> new Lines(
                    who + " t'a ajouté au groupe " + name,
                    "Tu fais partie du groupe " + name,
                    who + " t'a ajouté au groupe " + name + ". Un groupe n'ouvre aucun projet "
                            + "par lui-même : il sert à vous réunir pour les invitations.",
                    destination, open
            );
            case REMOVED_FROM_GROUP -> new Lines(
                    who + " t'a retiré du groupe " + name,
                    "Tu ne fais plus partie du groupe " + name,
                    who + " t'a retiré du groupe " + name
                            + ". Tes projets et tes tâches ne changent pas.",
                    "/carnet", "Ouvrir le carnet"
            );
            case MEMBER_LEFT_GROUP -> new Lines(
                    who + " a quitté ton groupe " + name,
                    who + " a quitté le groupe " + name,
                    who + " a quitté le groupe " + name + ", que tu gères.",
                    destination, open
            );
            // "En retrait", never "suspendu": the account is untouched and
            // the line must not let anyone think otherwise.
            case HELD_IN_GROUP -> new Lines(
                    "Tu es en retrait du groupe " + name,
                    "Mis en retrait du groupe " + name,
                    who + " t'a mis en retrait du groupe " + name + ". Tu en restes membre, "
                            + "mais tu ne seras pas invité quand le groupe l'est. Ton compte "
                            + "n'est pas touché.",
                    destination, open
            );
            case RESTORED_IN_GROUP -> new Lines(
                    "Tu es de retour dans le groupe " + name,
                    "De retour dans le groupe " + name,
                    who + " a levé ton retrait du groupe " + name + ".",
                    destination, open
            );
        };
    }
}
