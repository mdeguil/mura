package io.mura.admin;

import io.mura.member.AccountRole;
import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.support.Fixtures;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FirstAdministratorTest {

    @Mock
    private UserRepository userRepository;

    private FirstAdministrator designating(String email) {
        return new FirstAdministrator(userRepository, email);
    }

    @Test
    void theDesignatedAccountBecomesAdministratorOnAnInstanceWithoutOne() {
        User alice = Fixtures.user("alice");
        when(userRepository.existsByAccountRoleAndSuspendedAtIsNull(AccountRole.ADMIN)).thenReturn(false);

        assertThat(designating(" Alice@Mura.TEST ").promoteIfDesignated(alice)).isTrue();

        assertThat(alice.getAccountRole()).isEqualTo(AccountRole.ADMIN);
        verify(userRepository).save(alice);
    }

    @Test
    void anotherAddressIsNeverPromoted() {
        User bob = Fixtures.user("bob");

        assertThat(designating("alice@mura.test").promoteIfDesignated(bob)).isFalse();
        assertThat(bob.getAccountRole()).isEqualTo(AccountRole.USER);
    }

    @Test
    void anUnconfirmedAddressProvesNothingYet() {
        User alice = Fixtures.user("alice");
        alice.setEmailVerifiedAt(null);

        assertThat(designating("alice@mura.test").promoteIfDesignated(alice)).isFalse();
        verify(userRepository, never()).save(any());
    }

    @Test
    void onceAnAdministratorExistsTheVariableNoLongerDecides() {
        User alice = Fixtures.user("alice");
        when(userRepository.existsByAccountRoleAndSuspendedAtIsNull(AccountRole.ADMIN)).thenReturn(true);

        assertThat(designating("alice@mura.test").promoteIfDesignated(alice)).isFalse();
        assertThat(alice.getAccountRole()).isEqualTo(AccountRole.USER);
    }

    @Test
    void withoutADesignatedAddressNobodyIsPromoted() {
        User alice = Fixtures.user("alice");

        assertThat(designating("").promoteIfDesignated(alice)).isFalse();
        assertThat(designating(null).promoteIfDesignated(alice)).isFalse();
    }

    @Test
    void aSuspendedAccountIsNotPromoted() {
        User alice = Fixtures.suspended(Fixtures.user("alice"));

        assertThat(designating("alice@mura.test").promoteIfDesignated(alice)).isFalse();
    }

    @Test
    void theStartupWarningOnlyAppearsWithoutAnAdministrator() {
        when(userRepository.existsByAccountRoleAndSuspendedAtIsNull(AccountRole.ADMIN)).thenReturn(false, true);

        assertThat(designating("").warnIfNoAdministrator()).isTrue();
        assertThat(designating("").warnIfNoAdministrator()).isFalse();
    }
}
