package io.mura.mail;

import jakarta.mail.MessagingException;
import org.junit.jupiter.api.Test;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MailServerCheckTest {

    @Test
    void aServerThatAnswersPassesTheCheck() throws Exception {
        JavaMailSenderImpl smtp = mock(JavaMailSenderImpl.class);

        assertThat(new MailServerCheck(smtp, Runnable::run).check()).isTrue();
        verify(smtp).testConnection();
    }

    @Test
    void aServerThatDoesNotAnswerIsReportedWithoutStoppingAnything() throws Exception {
        JavaMailSenderImpl smtp = mock(JavaMailSenderImpl.class);
        when(smtp.getHost()).thenReturn("smtp.nowhere.test");
        when(smtp.getPort()).thenReturn(587);
        doThrow(new MessagingException("Connection refused")).when(smtp).testConnection();

        assertThat(new MailServerCheck(smtp, Runnable::run).check()).isFalse();
    }

    @Test
    void theCheckRunsOnTheExecutorOnceTheAppIsReady() throws Exception {
        JavaMailSenderImpl smtp = mock(JavaMailSenderImpl.class);

        new MailServerCheck(smtp, Runnable::run).onReady();

        verify(smtp).testConnection();
    }

    @Test
    void aSenderThatIsNotSmtpIsLeftAlone() {
        assertThat(new MailServerCheck(mock(JavaMailSender.class), Runnable::run).check()).isTrue();
    }
}
