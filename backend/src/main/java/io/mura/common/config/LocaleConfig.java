package io.mura.common.config;

import io.mura.common.i18n.Texts;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.List;

/**
 * Which language a request is answered in: the one its
 * {@code Accept-Language} header asks for, among French and English, and
 * French when it asks for neither. The interface sends the language on
 * screen with every request, so error messages come back in it.
 */
@Configuration
public class LocaleConfig {

    /**
     * The resolver Spring MVC asks for each request's language; its answer
     * is what {@link Texts#current()} reads.
     *
     * @return a resolver limited to French and English, French by default
     */
    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setSupportedLocales(List.of(Texts.FRENCH, Texts.ENGLISH));
        resolver.setDefaultLocale(Texts.FRENCH);
        return resolver;
    }
}
