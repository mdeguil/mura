/** The frame around every page: the language switch, the top bar, the footer. */
export const fr = {
    language: {
        fr: 'Français',
        en: 'English',
        choose: 'Langue',
    },
    nav: {
        projects: 'Projets',
        carnet: 'Carnet',
        administration: 'Administration',
        account: 'mon compte',
        accountTitle: 'Mon compte',
        logout: 'Déconnexion',
    },
    footer: {
        label: 'Informations légales',
        legalNotice: 'Mentions légales',
        privacy: 'Confidentialité',
        website: 'Le site de Mura',
    },
    theme: {
        toLight: 'Passer en thème clair',
        toDark: 'Passer en thème sombre',
    },
    legalLayout: {
        updated: 'Mise à jour le {{date}}',
        undeclared:
            "Cette instance de Mura n'a pas déclaré qui l'administre. Si elle sert à d'autres personnes que celle qui l'a installée, son administrateur doit renseigner ces informations dans sa configuration (variables <code>VITE_LEGAL_*</code>).",
    },
}

/** The same, in English. */
export const en: typeof fr = {
    language: {
        fr: 'Français',
        en: 'English',
        choose: 'Language',
    },
    nav: {
        projects: 'Projects',
        carnet: 'Contacts',
        administration: 'Administration',
        account: 'my account',
        accountTitle: 'My account',
        logout: 'Sign out',
    },
    footer: {
        label: 'Legal information',
        legalNotice: 'Legal notice',
        privacy: 'Privacy',
        website: "Mura's website",
    },
    theme: {
        toLight: 'Switch to the light theme',
        toDark: 'Switch to the dark theme',
    },
    legalLayout: {
        updated: 'Updated on {{date}}',
        undeclared:
            'This Mura instance has not declared who runs it. If it serves anyone other than the person who installed it, its administrator has to fill in these details in its configuration (<code>VITE_LEGAL_*</code> variables).',
    },
}
