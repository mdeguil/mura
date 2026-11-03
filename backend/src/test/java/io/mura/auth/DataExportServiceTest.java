package io.mura.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.mura.auth.dto.DataExport;
import io.mura.common.exception.ApiException;
import io.mura.group.UserGroup;
import io.mura.group.UserGroupMember;
import io.mura.group.UserGroupMemberRepository;
import io.mura.member.Contact;
import io.mura.member.ContactRepository;
import io.mura.member.ContactStatus;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.notification.Notification;
import io.mura.notification.NotificationRepository;
import io.mura.notification.NotificationType;
import io.mura.project.InvitationStatus;
import io.mura.project.Project;
import io.mura.project.ProjectInvitation;
import io.mura.project.ProjectInvitationRepository;
import io.mura.project.ProjectMemberRepository;
import io.mura.project.ProjectRole;
import io.mura.support.Fixtures;
import io.mura.task.TaskRepository;
import io.mura.task.TaskStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataExportServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private ProjectMemberRepository projectMemberRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private UserGroupMemberRepository groupMemberRepository;
    @Mock
    private ContactRepository contactRepository;
    @Mock
    private ProjectInvitationRepository invitationRepository;
    @Mock
    private NotificationRepository notificationRepository;
    @InjectMocks
    private DataExportService service;

    private User alice;
    private User bob;

    @BeforeEach
    void setUp() {
        alice = Fixtures.user("alice");
        bob = Fixtures.user("bob");
    }

    private ProjectInvitation invitation(Project project, User invited, User by) {
        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setId(UUID.randomUUID());
        invitation.setProject(project);
        invitation.setInvitedUser(invited);
        invitation.setInvitedBy(by);
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setCreatedAt(Instant.parse("2026-03-01T00:00:00Z"));
        return invitation;
    }

    @Test
    void theExportGathersEverythingThatConcernsThePerson() throws Exception {
        Project project = Fixtures.project("Refonte", bob);
        UserGroup group = Fixtures.group("Design", bob);
        UserGroupMember inGroup = Fixtures.groupMember(group, alice);
        inGroup.setOnHoldAt(Instant.now());
        Contact contact = new Contact(alice, bob);
        contact.setStatus(ContactStatus.ACCEPTED);
        contact.setFavourite(true);
        Notification notification = new Notification();
        notification.setType(NotificationType.ADDED_TO_GROUP);
        notification.setGroupName("Design");
        notification.setActorName("bob");
        notification.setCreatedAt(Instant.parse("2026-03-02T00:00:00Z"));

        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
        when(projectMemberRepository.findAllForUser(alice.getId()))
                .thenReturn(List.of(Fixtures.member(project, alice, ProjectRole.ADMIN)));
        when(taskRepository.findAllAssignedTo(alice.getId()))
                .thenReturn(List.of(Fixtures.task(project, "Maquettes", TaskStatus.EN_COURS)));
        when(groupMemberRepository.findAllForUser(alice.getId())).thenReturn(List.of(inGroup));
        when(contactRepository.findAllForOwner(alice.getId())).thenReturn(List.of(contact));
        when(contactRepository.findPendingForPerson(alice.getId())).thenReturn(List.of(new Contact(Fixtures.user("carol"), alice)));
        when(invitationRepository.findAllInvolving(alice.getId())).thenReturn(List.of(
                invitation(project, alice, bob), invitation(Fixtures.project("Mien", alice), bob, alice)));
        when(notificationRepository.findAllByUserIdOrderByCreatedAtDesc(alice.getId())).thenReturn(List.of(notification));

        DataExport export = service.export(alice.getId());

        assertThat(export.account().username()).isEqualTo("alice");
        assertThat(export.projects()).singleElement().satisfies(p -> {
            assertThat(p.name()).isEqualTo("Refonte");
            assertThat(p.role()).isEqualTo("ADMIN");
            assertThat(p.owner()).isEqualTo("bob");
        });
        assertThat(export.assignedTasks()).extracting(DataExport.TaskEntry::project).containsExactly("Refonte");
        assertThat(export.groups()).singleElement().satisfies(g -> {
            assertThat(g.manager()).isEqualTo("bob");
            assertThat(g.onHold()).isTrue();
        });
        assertThat(export.carnet()).singleElement().satisfies(c -> assertThat(c.favourite()).isTrue());
        assertThat(export.contactRequestsReceived()).extracting(DataExport.ContactEntry::person).containsExactly("carol");
        assertThat(export.invitations()).extracting(DataExport.InvitationEntry::direction).containsExactly("RECEIVED", "SENT");
        assertThat(export.notifications()).singleElement().satisfies(n -> {
            assertThat(n.about()).isEqualTo("Design");
            assertThat(n.read()).isFalse();
        });

        // Written the way the endpoint writes it: no hash of the password
        // anywhere in the file.
        String json = new ObjectMapper().registerModule(new JavaTimeModule()).writeValueAsString(export);
        assertThat(json).doesNotContain(alice.getPassword()).doesNotContain("password");
    }

    @Test
    void anAccountThatNoLongerExistsHasNothingToExport() {
        when(userRepository.findById(alice.getId())).thenReturn(Optional.empty());

        assertThat(catchThrowable(() -> service.export(alice.getId())))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getStatus()).isEqualTo(HttpStatus.NOT_FOUND));
    }
}
