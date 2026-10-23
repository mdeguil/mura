package io.mura.mail;

public enum EmailTokenPurpose {
    // Six digits, typed back into the app.
    EMAIL_VERIFICATION,
    // A long random string, carried in a link.
    PASSWORD_RESET
}
