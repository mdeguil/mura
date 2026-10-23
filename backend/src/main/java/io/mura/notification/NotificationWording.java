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
                ? "/carnet"
                : notification.getProject() == null
                        ? "/projets"
                        : "/project/" + notification.getProject().getId();
        String open = aboutGroup ? "Ouvrir le carnet" : "Ouvrir le projet";

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
        };
    }
}
