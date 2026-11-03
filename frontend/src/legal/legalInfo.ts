// Who publishes this instance of Mura and where it runs, as the Mentions
// légales (LCEN, art. 6-III) and the politique de confidentialité (RGPD,
// art. 13) must say.
//
// Mura itself is open-source software, not a service: those duties fall on
// whoever puts an instance online, and the facts are theirs. So they are
// read from the environment at build time (VITE_LEGAL_* in .env, passed to
// the frontend image as build arguments) rather than written into the code.
// An instance that has not declared them -- one running on a laptop, say --
// leaves them empty, and the legal pages say so in plain words.
const read = (value: string | undefined): string | null => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

const env = import.meta.env

export const LEGAL_INFO = {
    publisher: {
        // A person's name, or a company's name, legal form and registration
        // number.
        name: read(env.VITE_LEGAL_PUBLISHER_NAME),
        address: read(env.VITE_LEGAL_PUBLISHER_ADDRESS),
        email: read(env.VITE_LEGAL_CONTACT_EMAIL),
        // Usually the publisher themself, or the company's legal
        // representative.
        publicationDirector: read(env.VITE_LEGAL_PUBLICATION_DIRECTOR),
    },
    host: {
        name: read(env.VITE_LEGAL_HOST_NAME),
        address: read(env.VITE_LEGAL_HOST_ADDRESS),
        phone: read(env.VITE_LEGAL_HOST_PHONE),
    },
    // Where people write about their data. The publisher's contact address
    // unless the instance names a dedicated one.
    privacyContact: read(env.VITE_LEGAL_PRIVACY_CONTACT) ?? read(env.VITE_LEGAL_CONTACT_EMAIL),
    // Shown at the top of both pages; change it whenever their text does.
    lastUpdated: '3 novembre 2026',
}

// The least an instance open to the public has to declare: who publishes
// it, how to reach them, and who hosts it.
export function legalInfoDeclared(): boolean {
    const { publisher, host } = LEGAL_INFO
    return Boolean(publisher.name && publisher.email && host.name)
}
