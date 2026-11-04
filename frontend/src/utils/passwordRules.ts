/** One rule a password has to meet, and whether the typed one does. */
export type PasswordRule = {
    /** The rule, as the form shows it. */
    label: string
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
        { label: 'Au moins 8 caractères', met: password.length >= 8 && password.length <= 72 },
        { label: 'Une majuscule', met: /\p{Lu}/u.test(password) },
        { label: 'Une minuscule', met: /\p{Ll}/u.test(password) },
        { label: 'Un chiffre', met: /\d/.test(password) },
        {
            label: 'Un caractère spécial',
            // Anything that is not a letter, a digit or a space. Spelling out
            // a list would refuse perfectly good characters nobody thought of.
            met: /[^\p{L}\p{N}\s]/u.test(password),
        },
        {
            label: "Différent de ton email et de ton nom d'utilisateur",
            // Unmet only once there is something to compare against, so the
            // list does not open on a red cross for an empty form.
            met:
                password.length > 0 &&
                (trimmedEmail.length === 0 || lower !== trimmedEmail) &&
                (trimmedUser.length === 0 || lower !== trimmedUser),
        },
    ]
}
