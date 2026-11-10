package io.mura.common.i18n;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;

import java.io.InputStream;
import java.util.Locale;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

class TextsTest {

    @AfterEach
    void forgetTheRequest() {
        LocaleContextHolder.resetLocaleContext();
    }

    @Test
    void frenchIsTheAnswerWhenNothingSaysOtherwise() {
        assertThat(Texts.current()).isEqualTo(Texts.FRENCH);
        assertThat(Texts.get("error.task.notFound")).isEqualTo("Tâche introuvable.");

        LocaleContextHolder.setLocale(Locale.GERMAN);
        assertThat(Texts.get("error.task.notFound")).isEqualTo("Tâche introuvable.");
    }

    @Test
    void theRequestsLanguageIsFollowed() {
        LocaleContextHolder.setLocale(Locale.forLanguageTag("en-GB"));

        assertThat(Texts.current()).isEqualTo(Texts.ENGLISH);
        assertThat(Texts.get("error.task.notFound")).isEqualTo("Task not found.");
    }

    @Test
    void placeholdersAreFilledAndApostrophesKept() {
        assertThat(Texts.get(Texts.FRENCH, "error.group.noAccount", "bob@mura.test"))
                .isEqualTo("Aucun compte Mura n'utilise l'email bob@mura.test.");
        assertThat(Texts.get(Texts.ENGLISH, "error.directory.alreadySaved", "bob"))
                .isEqualTo("bob is already in your contacts.");
    }

    @Test
    void aTextThatIsNotAKeyComesBackAsItIs() {
        assertThat(Texts.get("Déjà traduit.")).isEqualTo("Déjà traduit.");
        assertThat(Texts.get((String) null)).isEmpty();
    }

    @Test
    void languageCodesGoBothWays() {
        assertThat(Texts.language("en")).isEqualTo(Texts.ENGLISH);
        assertThat(Texts.language("EN-us")).isEqualTo(Texts.ENGLISH);
        assertThat(Texts.language("fr")).isEqualTo(Texts.FRENCH);
        assertThat(Texts.language("de")).isEqualTo(Texts.FRENCH);
        assertThat(Texts.language(null)).isEqualTo(Texts.FRENCH);
        assertThat(Texts.code(Texts.ENGLISH)).isEqualTo("en");
        assertThat(Texts.code(Locale.GERMAN)).isEqualTo("fr");
    }

    @Test
    void bothLanguagesHaveTheSameKeys() throws Exception {
        Properties french = load("/messages.properties");
        Properties english = load("/messages_en.properties");

        assertThat(english.stringPropertyNames()).isEqualTo(french.stringPropertyNames());
        assertThat(english.values()).allSatisfy(text -> assertThat(text.toString()).isNotBlank());
    }

    private static Properties load(String path) throws Exception {
        Properties properties = new Properties();
        try (InputStream in = TextsTest.class.getResourceAsStream(path)) {
            properties.load(new java.io.InputStreamReader(in, java.nio.charset.StandardCharsets.UTF_8));
        }
        return properties;
    }
}
