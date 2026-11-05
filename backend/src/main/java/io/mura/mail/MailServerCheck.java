package io.mura.mail;

import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.task.TaskExecutor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

/**
 * Tries the mail server once the backend has started, and says in the log
 * whether it answered. Sign-up depends on a mailed code and a forgotten
 * password on a mailed link, yet a mail that fails is only logged when it
 * is sent: without this check, an instance whose mail settings are wrong
 * would look healthy until the first person tried to register. The check
 * runs off the startup thread, so a slow or silent server does not delay
 * the backend, and it never stops it.
 */
@Component
public class MailServerCheck {

    private static final Logger log = LoggerFactory.getLogger(MailServerCheck.class);

    private final JavaMailSender sender;
    private final TaskExecutor executor;

    /**
     * A check over the sender Spring configured from the {@code MAIL_*}
     * settings.
     *
     * @param sender the mail sender the app uses
     * @param executor where the check runs, off the startup thread
     */
    public MailServerCheck(JavaMailSender sender, TaskExecutor executor) {
        this.sender = sender;
        this.executor = executor;
    }

    /** Starts the check once the application is ready. */
    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        executor.execute(this::check);
    }

    /**
     * Connects to the mail server and logs the outcome: INFO when it
     * answered, WARN with what to set when it did not. Does nothing for a
     * sender that is not SMTP.
     *
     * @return true if the server answered, false otherwise
     */
    boolean check() {
        if (!(sender instanceof JavaMailSenderImpl smtp)) {
            return true;
        }
        String server = smtp.getHost() + ":" + smtp.getPort();
        try {
            smtp.testConnection();
            log.info("Mail server {} answered; Mura can send its mails.", server);
            return true;
        } catch (MessagingException e) {
            log.warn("Mura cannot reach the mail server {} ({}). Registration codes, reset links and "
                    + "notifications will not arrive. Check MAIL_HOST, MAIL_PORT, MAIL_USERNAME, "
                    + "MAIL_PASSWORD, MAIL_STARTTLS and MAIL_SSL in .env.", server, e.getMessage());
            return false;
        }
    }
}
