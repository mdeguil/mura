package io.mura.common.i18n;

import org.springframework.context.i18n.LocaleContext;
import org.springframework.context.i18n.LocaleContextHolder;

import java.util.Locale;
import java.util.MissingResourceException;
import java.util.ResourceBundle;

/**
 * Mura's texts in French and English, from {@code messages.properties} and
 * {@code messages_en.properties}. French is the reference language and the
 * answer whenever nothing says otherwise: a request without
 * {@code Accept-Language}, code running outside a request, a language Mura
 * does not speak.
 *
 * <p>Placeholders are {@code {0}}, {@code {1}}..., replaced as they are,
 * without {@link java.text.MessageFormat}: an apostrophe in a French
 * sentence needs no escaping.
 */
public final class Texts {

    /** The reference language. */
    public static final Locale FRENCH = Locale.FRENCH;

    /** The other language the interface is written in. */
    public static final Locale ENGLISH = Locale.ENGLISH;

    private static final String BUNDLE = "messages";
    private static final ResourceBundle.Control NO_SYSTEM_FALLBACK =
            ResourceBundle.Control.getNoFallbackControl(ResourceBundle.Control.FORMAT_PROPERTIES);

    private Texts() {
    }

    /**
     * The language a code stands for.
     *
     * @param code {@code en} for English; anything else, null included,
     *        means French
     * @return {@link #ENGLISH} or {@link #FRENCH}
     */
    public static Locale language(String code) {
        return code != null && code.trim().toLowerCase(Locale.ROOT).startsWith("en") ? ENGLISH : FRENCH;
    }

    /**
     * The code of a language, as accounts store it.
     *
     * @param locale a locale, null for French
     * @return {@code en} or {@code fr}
     */
    public static String code(Locale locale) {
        return locale != null && "en".equals(locale.getLanguage()) ? "en" : "fr";
    }

    /**
     * The language of the request being handled, from its
     * {@code Accept-Language}; French outside a request.
     *
     * @return {@link #ENGLISH} or {@link #FRENCH}
     */
    public static Locale current() {
        LocaleContext context = LocaleContextHolder.getLocaleContext();
        Locale locale = context == null ? null : context.getLocale();
        return locale == null ? FRENCH : language(locale.getLanguage());
    }

    /**
     * A text in the language of the request being handled.
     *
     * @param key the text's key, or a text that is not a key, returned as it
     *        is
     * @param args what replaces {@code {0}}, {@code {1}}...
     * @return the text, filled in
     */
    public static String get(String key, Object... args) {
        return get(current(), key, args);
    }

    /**
     * A text in a given language, for what goes to someone other than the
     * person making the request: a mail, a notification.
     *
     * @param locale the language to write in
     * @param key the text's key, or a text that is not a key, returned as it
     *        is
     * @param args what replaces {@code {0}}, {@code {1}}...
     * @return the text, filled in
     */
    public static String get(Locale locale, String key, Object... args) {
        String text = lookup(language(locale == null ? null : locale.getLanguage()), key);
        for (int i = 0; i < args.length; i++) {
            text = text.replace("{" + i + "}", String.valueOf(args[i]));
        }
        return text;
    }

    private static String lookup(Locale locale, String key) {
        if (key == null) {
            return "";
        }
        try {
            ResourceBundle bundle = ResourceBundle.getBundle(BUNDLE, locale, NO_SYSTEM_FALLBACK);
            return bundle.containsKey(key) ? bundle.getString(key) : key;
        } catch (MissingResourceException e) {
            return key;
        }
    }
}
