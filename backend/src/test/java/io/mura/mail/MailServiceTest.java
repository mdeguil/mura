package io.mura.mail;

import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MailServiceTest {

    @Mock
    private JavaMailSender sender;

    private MailService service;

    @BeforeEach
    void setUp() {
        service = new MailService(sender, Runnable::run);
        ReflectionTestUtils.setField(service, "from", "Mura <bonjour@mura.test>");
        ReflectionTestUtils.setField(service, "appUrl", "https://mura.example");
        lenient().when(sender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
    }

    private MimeMessage sent() throws Exception {
        ArgumentCaptor<MimeMessage> captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(captor.capture());
        MimeMessage message = captor.getValue();
        message.saveChanges();
        return message;
    }

    private String html(MimeMessage message) throws Exception {
        return (String) message.getContent();
    }

    @Test
    void theVerificationCodeGoesToTheAddressGiven() throws Exception {
        service.sendVerificationCode("bob@mura.test", "bob", "482913");

        MimeMessage message = sent();
        assertThat(message.getRecipients(Message.RecipientType.TO)[0].toString()).isEqualTo("bob@mura.test");
        assertThat(message.getSubject()).isEqualTo("Ton code de vérification Mura");
        assertThat(html(message)).contains("482913");
    }

    @Test
    void theResetLinkPointsAtTheAppNotTheApi() throws Exception {
        service.sendPasswordReset("bob@mura.test", "bob", "tok-123");

        assertThat(html(sent())).contains("https://mura.example/reset-password?token=tok-123");
    }

    @Test
    void aNotificationCarriesItsMessageAndALinkIntoTheApp() throws Exception {
        service.sendNotification("bob@mura.test", "bob", "Sujet", "Titre", "Phrase.", "Un mot",
                "/projets", "Voir mes projets");

        String body = html(sent());
        assertThat(body).contains("Phrase.").contains("<blockquote").contains("Un mot")
                .contains("href=\"https://mura.example/projets\"");
    }

    @Test
    void aNotificationWithoutMessageHasNoQuote() throws Exception {
        service.sendNotification("bob@mura.test", "bob", "Sujet", "Titre", "Phrase.", "  ", "/projets", "Voir");

        assertThat(html(sent())).doesNotContain("<blockquote");
    }

    @Test
    void whatPeopleTypedIsEscapedBeforeItReachesSomeoneElsesInbox() throws Exception {
        service.sendProjectInvitation("bob@mura.test", "bob", "<script>alert(1)</script>", "Refonte & co");

        String body = html(sent());
        assertThat(body).doesNotContain("<script>").contains("&lt;script&gt;").contains("Refonte &amp; co");
    }

    @Test
    void insideATransactionTheMailWaitsForTheCommit() {
        TransactionSynchronizationManager.initSynchronization();
        try {
            service.sendVerificationCode("bob@mura.test", "bob", "482913");
            verify(sender, never()).send(any(MimeMessage.class));

            TransactionSynchronizationManager.getSynchronizations().forEach(TransactionSynchronization::afterCommit);
            verify(sender).send(any(MimeMessage.class));
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void aRolledBackTransactionSendsNothing() {
        TransactionSynchronizationManager.initSynchronization();
        try {
            service.sendProjectInvitation("bob@mura.test", "bob", "alice", "Refonte");

            TransactionSynchronizationManager.getSynchronizations()
                    .forEach(sync -> sync.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK));
            verifyNoInteractions(sender);
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void aMailServerFailureIsLoggedNotThrown() {
        doThrow(new MailSendException("serveur injoignable")).when(sender).send(any(MimeMessage.class));

        assertThatCode(() -> service.sendVerificationCode("bob@mura.test", "bob", "000000")).doesNotThrowAnyException();
    }
}
