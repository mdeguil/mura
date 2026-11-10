package io.mura.notification;

import java.util.Locale;
import io.mura.group.UserGroup;
import io.mura.member.User;
import io.mura.project.Project;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import static org.assertj.core.api.Assertions.assertThat;

class NotificationWordingTest {

    private final User alice = Fixtures.user("alice");

    private Notification aboutProject(NotificationType type, Project project) {
        Notification notification = new Notification();
        notification.setType(type);
        notification.setActorName("alice");
        notification.setProject(project);
        notification.setProjectName("Refonte");
        return notification;
    }

    private Notification aboutGroup(NotificationType type, UserGroup group) {
        Notification notification = new Notification();
        notification.setType(type);
        notification.setActorName("alice");
        notification.setGroup(group);
        notification.setGroupName("Design");
        return notification;
    }

    @ParameterizedTest
    @EnumSource(NotificationType.class)
    void everyTypeSaysSomethingAndLeadsSomewhere(NotificationType type) {
        NotificationWording.Lines lines = NotificationWording.of(aboutProject(type, Fixtures.project("Refonte", alice)), Locale.FRENCH);

        assertThat(lines.subject()).isNotBlank();
        assertThat(lines.heading()).isNotBlank();
        assertThat(lines.sentence()).isNotBlank();
        assertThat(lines.linkPath()).startsWith("/");
        assertThat(lines.linkLabel()).isNotBlank();
    }

    @Test
    void aProjectStillOpenToTheReaderLeadsToIt() {
        Project project = Fixtures.project("Refonte", alice);

        NotificationWording.Lines lines = NotificationWording.of(aboutProject(NotificationType.ADDED_TO_PROJECT, project), Locale.FRENCH);

        assertThat(lines.subject()).isEqualTo("alice t'a ajouté à Refonte");
        assertThat(lines.linkPath()).isEqualTo("/project/" + project.getId());
    }

    @Test
    void someoneRemovedFromAProjectIsSentToTheListInstead() {
        NotificationWording.Lines lines = NotificationWording.of(
                aboutProject(NotificationType.REMOVED_FROM_PROJECT, Fixtures.project("Refonte", alice)), Locale.FRENCH);

        assertThat(lines.linkPath()).isEqualTo("/projets");
    }

    @Test
    void aGroupStillThereLeadsToItsPageAndAGoneOneToTheCarnet() {
        UserGroup group = Fixtures.group("Design", alice);

        assertThat(NotificationWording.of(aboutGroup(NotificationType.ADDED_TO_GROUP, group), Locale.FRENCH).linkPath())
                .isEqualTo("/groupe/" + group.getId());
        assertThat(NotificationWording.of(aboutGroup(NotificationType.ADDED_TO_GROUP, null), Locale.FRENCH).linkPath())
                .isEqualTo("/carnet");
    }

    @Test
    void anAccountNewsSaysWhetherItIsAboutAGroupOrAProject() {
        assertThat(NotificationWording.of(aboutGroup(NotificationType.MEMBER_SUSPENDED, null), Locale.FRENCH).sentence())
                .contains("dans ton groupe Design");
        assertThat(NotificationWording.of(aboutProject(NotificationType.MEMBER_SUSPENDED, null), Locale.FRENCH).sentence())
                .contains("sur ton projet Refonte");
    }

    @Test
    void beingSetAsideNeverReadsAsASuspension() {
        String sentence = NotificationWording.of(aboutGroup(NotificationType.HELD_IN_GROUP, null), Locale.FRENCH).sentence();

        assertThat(sentence).contains("en retrait").contains("Ton compte n'est pas touché").doesNotContain("suspendu");
    }

    @Test
    void theMailIsWordedInTheRecipientsLanguage() {
        NotificationWording.Lines lines = NotificationWording.of(
                aboutGroup(NotificationType.MEMBER_SUSPENDED, null), Locale.ENGLISH);

        assertThat(lines.subject()).isEqualTo("alice's account was suspended");
        assertThat(lines.sentence()).contains("they are in your group Design");
        assertThat(lines.linkLabel()).isEqualTo("Open your contacts");
    }
}
