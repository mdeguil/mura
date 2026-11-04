package io.mura;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point of the Mura API: a Spring Boot application serving the
 * {@code /api} routes the frontend calls.
 */
@SpringBootApplication
public class MuraApplication {

    /**
     * Starts the application.
     *
     * @param args command-line arguments, passed on to Spring Boot
     */
    public static void main(String[] args) {
        SpringApplication.run(MuraApplication.class, args);
    }
}
