package io.mura.mail;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender sender;

    @Value("${mura.mail.from}")
    private String from;

    @Value("${mura.app.url}")
    private String appUrl;

    // Each of these is @Async, not the send() below: Spring applies it
    // through a proxy, and a call from inside the class never goes through
    // one. A slow mail server has no business holding up a registration,
    // and a mail that fails to leave must not undo the account just made.
    @Async
    public void sendVerificationCode(String to, String username, String code) {
        send(to, "Ton code de vérification Mura", body(
                "Bienvenue, " + escape(username) + " 👋",
                "<p>Voici le code qui confirme ton adresse :</p>"
                        + "<p style=\"font-size:28px;font-weight:700;letter-spacing:6px;"
                        + "margin:24px 0;color:#1e293b\">" + escape(code) + "</p>"
                        + "<p style=\"color:#64748b\">Il est valable 15 minutes. "
                        + "Si tu n'as pas créé de compte Mura, ignore ce message.</p>"
        ));
    }

    @Async
    public void sendPasswordReset(String to, String username, String token) {
        String link = appUrl + "/reset-password?token=" + token;
        send(to, "Réinitialiser ton mot de passe Mura", body(
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

    @Async
    public void sendProjectInvitation(String to, String username, String inviter, String project) {
        send(to, inviter + " t'invite sur " + project, body(
                "Une invitation t'attend",
                "<p>Bonjour " + escape(username) + ",</p>"
                        + "<p><strong>" + escape(inviter) + "</strong> t'invite à rejoindre le projet "
                        + "<strong>" + escape(project) + "</strong> sur Mura.</p>"
                        + button(appUrl + "/projets", "Voir l'invitation")
                        + "<p style=\"color:#64748b\">Tu la retrouveras aussi dans tes notifications. "
                        + "Elle expire dans 14 jours.</p>"
        ));
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
            // Logged rather than thrown: the caller's work is already done and
            // correct, and there is nothing it could do about a mail server.
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

    // A username is whatever its owner typed, and it goes into a page that
    // somebody else opens.
    private String escape(String value) {
        return value == null
                ? ""
                : value.replace("&", "&amp;")
                        .replace("<", "&lt;")
                        .replace(">", "&gt;")
                        .replace("\"", "&quot;");
    }
}
