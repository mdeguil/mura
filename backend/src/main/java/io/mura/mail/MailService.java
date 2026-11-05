package io.mura.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskExecutor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.nio.charset.StandardCharsets;

/**
 * Writes and sends Mura's mails, in French, as HTML. Every mail waits for
 * the transaction that asked for it to commit, then leaves off the request
 * thread; a mail that fails to leave is logged, never thrown. What people
 * typed -- names, project names, messages -- is escaped before it goes into
 * a page somebody else opens.
 */
@Service
@RequiredArgsConstructor
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender sender;
    private final TaskExecutor executor;

    @Value("${mura.mail.from}")
    private String from;

    @Value("${mura.app.url}")
    private String appUrl;

    /**
     * Mails the code that confirms a new account's address.
     *
     * @param to the address to confirm
     * @param username who to greet
     * @param code the six digits
     */
    public void sendVerificationCode(String to, String username, String code) {
        deliver(to, "Ton code de vérification Mura", body(
                "Bienvenue, " + escape(username) + " 👋",
                "<p>Voici le code qui confirme ton adresse :</p>"
                        + "<p style=\"font-size:28px;font-weight:700;letter-spacing:6px;"
                        + "margin:24px 0;color:#1e293b\">" + escape(code) + "</p>"
                        + "<p style=\"color:#64748b\">Il est valable 15 minutes. "
                        + "Si tu n'as pas créé de compte Mura, ignore ce message.</p>"
        ));
    }

    /**
     * Mails a link to choose a new password. The link points at the app
     * ({@code mura.app.url}), not at the API.
     *
     * @param to the account's address
     * @param username who to greet
     * @param token the value the link carries
     */
    public void sendPasswordReset(String to, String username, String token) {
        String link = appUrl + "/reset-password?token=" + token;
        deliver(to, "Réinitialiser ton mot de passe Mura", body(
                "Mot de passe oublié ?",
                "<p>Bonjour " + escape(username) + ",</p>"
                        + "<p>Clique sur le bouton pour choisir un nouveau mot de passe :</p>"
                        + button(link, "Choisir un nouveau mot de passe")
                        + "<p style=\"color:#64748b\">Le lien est valable 1 heure et ne sert qu'une "
                        + "fois. Si tu n'as rien demandé, il n'y a rien à faire : ton mot de passe "
                        + "actuel reste valable.</p>"
                        + "<p style=\"color:#94a3b8;font-size:12px;word-break:break-all\">"
                        + escape(link) + "</p>"
        ));
    }

    /**
     * Mails a notification. Every notification goes out as mail too: the
     * bell only reaches somebody who happens to be looking at Mura, and most
     * of what it carries is news they would rather not wait to see.
     *
     * @param to the recipient's address
     * @param username who to greet
     * @param subject the mail's subject
     * @param heading the title inside the mail
     * @param sentence what happened, in one sentence
     * @param message the note that came with it, quoted; null or blank for
     *        none
     * @param linkPath where in the app the button leads, such as
     *        {@code /projets}
     * @param linkLabel what the button says
     */
    public void sendNotification(
            String to,
            String username,
            String subject,
            String heading,
            String sentence,
            String message,
            String linkPath,
            String linkLabel
    ) {
        String note = message == null || message.isBlank()
                ? ""
                : "<blockquote style=\"margin:16px 0;padding:8px 0 8px 12px;"
                        + "border-left:3px solid #cbd5e1;color:#475569;font-style:italic\">"
                        + escape(message) + "</blockquote>";

        deliver(to, subject, body(
                heading,
                "<p>Bonjour " + escape(username) + ",</p>"
                        + "<p>" + escape(sentence) + "</p>"
                        + note
                        + button(appUrl + linkPath, linkLabel)
        ));
    }

    /**
     * Mails an invitation to join a project.
     *
     * @param to the invitee's address
     * @param username who to greet
     * @param inviter the username of whoever sent it
     * @param project the project's name
     */
    public void sendProjectInvitation(String to, String username, String inviter, String project) {
        deliver(to, inviter + " t'invite sur " + project, body(
                "Une invitation t'attend",
                "<p>Bonjour " + escape(username) + ",</p>"
                        + "<p><strong>" + escape(inviter) + "</strong> t'invite à rejoindre le projet "
                        + "<strong>" + escape(project) + "</strong> sur Mura.</p>"
                        + button(appUrl + "/projets", "Voir l'invitation")
                        + "<p style=\"color:#64748b\">Tu la retrouveras aussi dans tes notifications. "
                        + "Elle expire dans 14 jours.</p>"
        ));
    }

    private void deliver(String to, String subject, String html) {
        Runnable delivery = () -> executor.execute(() -> send(to, subject, html));

        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            delivery.run();
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                delivery.run();
            }
        });
    }

    private void send(String to, String subject, String html) {
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper =
                    new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            sender.send(message);
            log.debug("Sent \"{}\" to {}", subject, to);
        } catch (Exception e) {
            log.error("Could not send \"{}\" to {}", subject, to, e);
        }
    }

    private String body(String heading, String content) {
        return """
                <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;
                            background:#f1f5f9;padding:32px 16px">
                  <div style="max-width:520px;margin:0 auto;background:#ffffff;
                              border-radius:16px;padding:32px">
                    <p style="font-size:18px;font-weight:600;color:#0f172a;margin:0 0 16px">Mura</p>
                    <h1 style="font-size:20px;color:#0f172a;margin:0 0 16px">%s</h1>
                    <div style="font-size:14px;color:#334155;line-height:1.6">%s</div>
                  </div>
                </div>
                """.formatted(heading, content);
    }

    private String button(String href, String label) {
        return "<p style=\"margin:24px 0\"><a href=\"" + escape(href) + "\" "
                + "style=\"display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;"
                + "padding:12px 20px;border-radius:10px;font-weight:600\">" + escape(label) + "</a></p>";
    }

    private String escape(String value) {
        return value == null
                ? ""
                : value.replace("&", "&amp;")
                        .replace("<", "&lt;")
                        .replace(">", "&gt;")
                        .replace("\"", "&quot;");
    }
}
