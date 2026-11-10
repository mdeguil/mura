/** The rules a password has to meet, named as in the `auth.rules` texts. */
export type PasswordRuleKey = 'length' | 'upper' | 'lower' | 'digit' | 'special' | 'distinct'

/** One rule a password has to meet, and whether the typed one does. */
export type PasswordRule = {
    /** Which rule; its sentence is `auth.rules.<key>` in the current language. */
    key: PasswordRuleKey
    /** Whether the password meets it. */
    met: boolean
}

/**
 * The rules the backend will apply, shown while the password is being
 * typed: a rule you only learn about after submitting is a rule that reads
 * as the form being broken. They are the same rules as the backend's
 * StrongPasswordValidator and the check in AuthService: change one, change
 * the other, or the form will accept a password the server then refuses.
 *
 * @param password the password as typed
 * @param email the address typed on the same form, or `''`
 * @param username the name typed on the same form, or `''`
 * @returns the six rules, each marked met or not
 */
export function passwordRules(password: string, email: string, username: string): PasswordRule[] {
    const trimmedEmail = email.trim().toLowerCase()
    const trimmedUser = username.trim().toLowerCase()
    const lower = password.toLowerCase()

    return [
        { key: 'length', met: password.length >= 8 && password.length <= 72 },
        { key: 'upper', met: /\p{Lu}/u.test(password) },
        { key: 'lower', met: /\p{Ll}/u.test(password) },
        { key: 'digit', met: /\d/.test(password) },
        {
            key: 'special',
            met: /[^\p{L}\p{N}\s]/u.test(password),
        },
        {
            key: 'distinct',
            met:
                password.length > 0 &&
                (trimmedEmail.length === 0 || lower !== trimmedEmail) &&
                (trimmedUser.length === 0 || lower !== trimmedUser),
        },
    ]
}
