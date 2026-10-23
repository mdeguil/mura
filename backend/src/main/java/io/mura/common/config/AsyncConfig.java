package io.mura.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

// Only the mail goes off-thread, and only so that a slow or unreachable
// mail server cannot make a registration or an invitation feel broken.
@Configuration
@EnableAsync
public class AsyncConfig {
}
