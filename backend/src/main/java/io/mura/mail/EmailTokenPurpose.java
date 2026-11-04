package io.mura.mail;

/** What an {@link EmailToken} was mailed for. */
public enum EmailTokenPurpose {
    /** Confirming the address: six digits, typed back into the app. */
    EMAIL_VERIFICATION,
    /** Resetting the password: a long random string, carried in a link. */
    PASSWORD_RESET
}
