/** The reader's own account page, and deleting it. */
export const fr = {
    account: {
        title: 'Mon compte',
        subtitle:
            'Ce que Mura sait de toi, et ce que tu peux en faire. Le détail est dans la <anchor>politique de confidentialité</anchor>.',
        yourAccount: 'Ton compte',
        username: "Nom d'utilisateur",
        email: 'Adresse e-mail',
        createdOn: 'Créé le',
        data: 'Tes données',
        dataHint:
            'Un fichier avec tout ce que Mura conserve sur toi : ton compte, tes projets, les tâches qui te sont confiées, tes groupes, ton carnet, tes invitations et tes notifications.',
        download: 'Télécharger mes données',
        preparing: 'Préparation…',
        exportFailed: 'Impossible de préparer tes données. Réessaie.',
        exportFile: 'mes-donnees-mura.json',
        delete: 'Supprimer mon compte',
        deleteHint:
            "Ton compte et ce qui n'appartient qu'à toi disparaissent pour de bon. Les projets que tu partages passent à un autre membre ; tu verras le détail avant de confirmer.",
        deleteOpen: 'Supprimer mon compte…',
        deleteDialog: {
            title: 'Supprimer ton compte ?',
            body: "C'est définitif : ni toi ni un administrateur ne pourrez le récupérer. Pense à télécharger tes données avant.",
            checking: 'Vérification en cours…',
            password: 'Ton mot de passe, pour confirmer',
            previewFailed: 'Impossible de préparer la suppression.',
            failed: 'Impossible de supprimer ton compte.',
            submit: 'Supprimer définitivement mon compte',
            submitting: 'Suppression…',
        },
    },
}

/** The same, in English. */
export const en: typeof fr = {
    account: {
        title: 'My account',
        subtitle: 'What Mura knows about you, and what you can do with it. The details are in the <anchor>privacy policy</anchor>.',
        yourAccount: 'Your account',
        username: 'Username',
        email: 'Email address',
        createdOn: 'Created on',
        data: 'Your data',
        dataHint:
            'A file with everything Mura keeps about you: your account, your projects, the tasks given to you, your groups, your contacts, your invitations and your notifications.',
        download: 'Download my data',
        preparing: 'Preparing…',
        exportFailed: 'Your data could not be prepared. Try again.',
        exportFile: 'my-mura-data.json',
        delete: 'Delete my account',
        deleteHint:
            'Your account and what belongs to you alone disappear for good. The projects you share go to another member; you will see the details before confirming.',
        deleteOpen: 'Delete my account…',
        deleteDialog: {
            title: 'Delete your account?',
            body: 'This is final: neither you nor an administrator can bring it back. Remember to download your data first.',
            checking: 'Checking…',
            password: 'Your password, to confirm',
            previewFailed: 'The deletion could not be prepared.',
            failed: 'Your account could not be deleted.',
            submit: 'Delete my account for good',
            submitting: 'Deleting…',
        },
    },
}
