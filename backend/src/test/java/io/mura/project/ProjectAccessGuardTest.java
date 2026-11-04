package io.mura.project;

import io.mura.common.exception.ApiException;
import io.mura.member.User;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowable;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProjectAccessGuardTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private ProjectMemberRepository memberRepository;
    @InjectMocks
    private ProjectAccessGuard access;

    private User alice;
    private User bob;
    private User carol;
    private Project project;

    @BeforeEach
    void setUp() {
        alice = Fixtures.user("alice");
        bob = Fixtures.user("bob");
        carol = Fixtures.user("carol");
        project = Fixtures.project("Refonte", alice);
        when(projectRepository.existsById(project.getId())).thenReturn(true);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(memberRepository.findByProjectIdAndUserId(project.getId(), alice.getId()))
                .thenReturn(Optional.of(Fixtures.member(project, alice, ProjectRole.OWNER)));
        when(memberRepository.findByProjectIdAndUserId(project.getId(), bob.getId()))
                .thenReturn(Optional.of(Fixtures.member(project, bob, ProjectRole.ADMIN)));
        when(memberRepository.findByProjectIdAndUserId(project.getId(), carol.getId()))
                .thenReturn(Optional.of(Fixtures.member(project, carol, ProjectRole.MEMBER)));
    }

    private static HttpStatus statusOf(Throwable thrown) {
        assertThat(thrown).isInstanceOf(ApiException.class);
        return ((ApiException) thrown).getStatus();
    }

    @Test
    void anUnknownProjectIsNotFoundBeforeAnythingIsRefused() {
        UUID unknown = UUID.randomUUID();

        assertThat(statusOf(catchThrowable(() -> access.requireMembership(alice.getId(), unknown))))
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(statusOf(catchThrowable(() -> access.requireManager(alice.getId(), unknown))))
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(statusOf(catchThrowable(() -> access.requireOwner(alice.getId(), unknown))))
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void everyMemberIsOnTheTeamAndNobodyElse() {
        assertThat(access.requireMembership(carol.getId(), project.getId()).getRole()).isEqualTo(ProjectRole.MEMBER);
        assertThat(statusOf(catchThrowable(() -> access.requireMembership(UUID.randomUUID(), project.getId()))))
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void theOwnerAndAdminsRunTheTeamButNotPlainMembers() {
        assertThat(access.requireManager(alice.getId(), project.getId()).getUser()).isEqualTo(alice);
        assertThat(access.requireManager(bob.getId(), project.getId()).getUser()).isEqualTo(bob);
        assertThat(statusOf(catchThrowable(() -> access.requireManager(carol.getId(), project.getId()))))
                .isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void someThingsStayWithTheOwnerAlone() {
        assertThat(access.requireOwner(alice.getId(), project.getId())).isSameAs(project);
        assertThat(statusOf(catchThrowable(() -> access.requireOwner(bob.getId(), project.getId()))))
                .isEqualTo(HttpStatus.FORBIDDEN);
    }
}
