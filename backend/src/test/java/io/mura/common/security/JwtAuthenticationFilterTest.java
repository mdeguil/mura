package io.mura.common.security;

import io.mura.member.User;
import io.mura.member.UserRepository;
import io.mura.support.Fixtures;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class JwtAuthenticationFilterTest {

    @Mock
    private JwtService jwtService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private FilterChain chain;
    @InjectMocks
    private JwtAuthenticationFilter filter;

    private User alice;

    @BeforeEach
    void setUp() {
        alice = Fixtures.user("alice");
        when(jwtService.isValid("good")).thenReturn(true);
        when(jwtService.extractUserId("good")).thenReturn(alice.getId());
        when(userRepository.findById(alice.getId())).thenReturn(Optional.of(alice));
    }

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    private Authentication run(String header, String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        if (header != null) {
            request.addHeader("Authorization", header);
        }
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        verify(chain).doFilter(any(), any());
        return SecurityContextHolder.getContext().getAuthentication();
    }

    @Test
    void aValidTokenOfAnActiveAccountAuthenticatesAsThatAccount() throws Exception {
        Authentication authentication = run("Bearer good", "/api/projects");

        assertThat(authentication).isNotNull();
        assertThat(authentication.getPrincipal()).isEqualTo(alice.getId());
    }

    @Test
    void noHeaderOrAnotherSchemeLeavesTheRequestAnonymous() throws Exception {
        assertThat(run(null, "/api/projects")).isNull();
        SecurityContextHolder.clearContext();
        org.mockito.Mockito.reset(chain);
        assertThat(run("Basic YWxpY2U6eA==", "/api/projects")).isNull();
        verifyNoInteractions(jwtService);
    }

    @Test
    void anInvalidTokenLeavesTheRequestAnonymous() throws Exception {
        when(jwtService.isValid("bad")).thenReturn(false);

        assertThat(run("Bearer bad", "/api/projects")).isNull();
    }

    @Test
    void aSuspensionBitesAtOnceEvenWithAValidToken() throws Exception {
        Fixtures.suspended(alice);

        assertThat(run("Bearer good", "/api/projects")).isNull();
    }

    @Test
    void aDeletedAccountsTokenNoLongerWorks() throws Exception {
        when(userRepository.findById(alice.getId())).thenReturn(Optional.empty());

        assertThat(run("Bearer good", "/api/projects")).isNull();
    }

    @Test
    void anUnverifiedAccountOnlyReachesTheCodeScreensEndpoints() throws Exception {
        alice.setEmailVerifiedAt(null);

        assertThat(run("Bearer good", "/api/projects")).isNull();
        for (String allowed : new String[]{"/api/auth/me", "/api/auth/verify", "/api/auth/verify/resend"}) {
            SecurityContextHolder.clearContext();
            org.mockito.Mockito.reset(chain);
            assertThat(run("Bearer good", allowed)).as(allowed).isNotNull();
        }
    }
}
