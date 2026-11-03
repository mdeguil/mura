// Who publishes Mura and where it runs, as the Mentions légales (LCEN,
// art. 6-III) and the politique de confidentialité (RGPD, art. 13) must say.
//
// These are facts about a person or a company, not something the code can
// know: whoever puts Mura online fills them in. Until then the legal pages
// say plainly that they are incomplete rather than showing a made-up name.
export const TO_FILL = 'À compléter'

export const LEGAL_INFO = {
    // Who answers for the service: a person's name, or a company's name,
    // legal form and registration number.
    publisher: {
        name: TO_FILL,
        address: TO_FILL,
        email: TO_FILL,
        // The person responsible for what is published, usually the
        // publisher themself or the company's legal representative.
        publicationDirector: TO_FILL,
    },
    host: {
        name: TO_FILL,
        address: TO_FILL,
        phone: TO_FILL,
    },
    // Where someone writes to exercise a right the account page does not
    // cover (rectifying an address, asking a question). Often the
    // publisher's own address.
    privacyContact: TO_FILL,
    // Shown at the top of both pages; change it whenever their text does.
    lastUpdated: '3 novembre 2026',
}

export function legalInfoIncomplete(): boolean {
    const { publisher, host, privacyContact } = LEGAL_INFO
    return [...Object.values(publisher), ...Object.values(host), privacyContact].includes(TO_FILL)
}
