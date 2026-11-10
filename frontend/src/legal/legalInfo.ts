const read = (value: string | undefined): string | null => {
    const trimmed = value?.trim()
    return trimmed ? trimmed : null
}

const env = import.meta.env

/**
 * The instance's legal details, as its operator declared them in the
 * `VITE_LEGAL_*` variables. Every field is null when not declared.
 */
export const LEGAL_INFO = {
    publisher: {
        name: read(env.VITE_LEGAL_PUBLISHER_NAME),
        address: read(env.VITE_LEGAL_PUBLISHER_ADDRESS),
        email: read(env.VITE_LEGAL_CONTACT_EMAIL),
        publicationDirector: read(env.VITE_LEGAL_PUBLICATION_DIRECTOR),
    },
    host: {
        name: read(env.VITE_LEGAL_HOST_NAME),
        address: read(env.VITE_LEGAL_HOST_ADDRESS),
        phone: read(env.VITE_LEGAL_HOST_PHONE),
    },
    privacyContact: read(env.VITE_LEGAL_PRIVACY_CONTACT) ?? read(env.VITE_LEGAL_CONTACT_EMAIL),
    lastUpdated: '2026-11-03',
}

/**
 * Whether the instance declared the least an instance open to the public
 * has to: who publishes it, how to reach them, and who hosts it.
 *
 * @returns true when the publisher's name and address and the host's name
 *          are all set
 */
export function legalInfoDeclared(): boolean {
    const { publisher, host } = LEGAL_INFO
    return Boolean(publisher.name && publisher.email && host.name)
}
