package io.mura.common.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.assertj.core.api.Assertions.assertThat;

class SecurityConfigTest {

    private CorsConfiguration corsFor(String allowedOrigins) {
        CorsConfigurationSource source = new SecurityConfig(null).corsConfigurationSource(allowedOrigins);
        return source.getCorsConfiguration(new MockHttpServletRequest("GET", "/api/projects"));
    }

    @Test
    void theInstanceAddressIsAllowedEvenWithATrailingSlash() {
        CorsConfiguration cors = corsFor("https://mura.example.org/");

        assertThat(cors.checkOrigin("https://mura.example.org")).isEqualTo("https://mura.example.org");
        assertThat(cors.checkOrigin("https://ailleurs.example")).isNull();
    }

    @Test
    void severalOriginsMayBeListedWithSpaces() {
        CorsConfiguration cors = corsFor("http://localhost:5173 , https://mura.example.org,");

        assertThat(cors.getAllowedOrigins()).containsExactly("http://localhost:5173", "https://mura.example.org");
    }
}
