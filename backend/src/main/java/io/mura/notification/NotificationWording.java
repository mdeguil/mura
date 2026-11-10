package io.mura.notification;

import io.mura.common.i18n.Texts;

import java.util.Locale;

/**
 * What a notification's mail says, in one place, so it cannot drift from
 * the bell. The sentences live in {@code messages.properties} under
 * {@code notification.<TYPE>.subject}, {@code .heading} and
 * {@code .sentence}, with {@code {0}} for who acted, {@code {1}} for the
 * project or group, and {@code {2}} for where the person concerned is.
 */
final class NotificationWording {

    /**
     * The words of one notification.
     *
     * @param subject the mail's subject
     * @param heading the title inside the mail
     * @param sentence what happened, in one sentence
     * @param linkPath where in the app the mail's button leads
     * @param linkLabel what that button says
     */
    record Lines(String subject, String heading, String sentence, String linkPath, String linkLabel) {}

    private NotificationWording() {}

    /**
     * Words a notification for its recipient.
     *
     * @param notification the stored notification
     * @param locale the recipient's language
     * @return what to say, and where to send the reader
     */
    static Lines of(Notification notification, Locale locale) {
        String who = notification.getActorName();
        boolean aboutGroup = notification.getGroupName() != null;
        String name = notification.getProjectName() != null
                ? notification.getProjectName()
                : notification.getGroupName();
        String where = aboutGroup
                ? Texts.get(locale, "notification.where.group", notification.getGroupName())
                : Texts.get(locale, "notification.where.project", notification.getProjectName());
        String destination = aboutGroup
                ? notification.getGroup() == null
                        ? "/carnet"
                        : "/groupe/" + notification.getGroup().getId()
                : notification.getProject() == null
                        ? "/projets"
                        : "/project/" + notification.getProject().getId();
        String open = aboutGroup
                ? notification.getGroup() == null ? "notification.open.carnet" : "notification.open.group"
                : "notification.open.project";

        String type = notification.getType().name();
        String path = switch (notification.getType()) {
            case REMOVED_FROM_PROJECT -> "/projets";
            case CONTACT_REQUESTED, CONTACT_ACCEPTED, GROUP_DELETED, REMOVED_FROM_GROUP -> "/carnet";
            default -> destination;
        };
        String label = switch (notification.getType()) {
            case REMOVED_FROM_PROJECT -> "notification.open.projects";
            case CONTACT_REQUESTED -> "notification.open.answer";
            case CONTACT_ACCEPTED -> "notification.open.myCarnet";
            case GROUP_DELETED, REMOVED_FROM_GROUP -> "notification.open.carnet";
            default -> open;
        };

        return new Lines(
                Texts.get(locale, "notification." + type + ".subject", who, name, where),
                Texts.get(locale, "notification." + type + ".heading", who, name, where),
                Texts.get(locale, "notification." + type + ".sentence", who, name, where),
                path,
                Texts.get(locale, label)
        );
    }
}
