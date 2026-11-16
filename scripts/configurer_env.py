#!/usr/bin/env python3
"""Crée le fichier .env de Mura en posant quelques questions, en français.

Le script part de .env.example, y met tes réponses, génère seul les secrets
et écrit .env à la racine du dépôt. Il ne demande que Python 3. Le même
script en anglais est scripts/configure_env.py.

Usage :
    python3 scripts/configurer_env.py                    écrit .env à la racine
    python3 scripts/configurer_env.py --sortie test.env  écrit un autre fichier
    py scripts/configurer_env.py                         sous Windows
"""

import sys

from env_wizard import run

TEXTS = {
    "description": "Crée le fichier .env de Mura en posant quelques questions.",
    "option": "--sortie",
    "option_help": "fichier à écrire (par défaut : .env à la racine du dépôt)",
    "no_color_help": "n'utilise pas de couleurs",
    "banner": "Mura · création de ton fichier .env",
    "intro": (
        "Cet assistant pose quelques questions et écrit le fichier .env dont Mura a besoin pour démarrer. "
        "Pour chacune, il explique pourquoi la réponse est nécessaire. Appuie sur Entrée pour garder la "
        "valeur proposée entre crochets. Rien n'est envoyé nulle part : les réponses vont seulement dans le fichier."
    ),
    "step": "Étape {n} sur {total}",
    "why": "Pourquoi :",
    "step_instance": "Ton instance",
    "step_mail": "E-mails",
    "step_secrets": "Secrets (automatique)",
    "step_review": "Vérifier et écrire",
    "required": "Cette réponse est obligatoire.",
    "bad_url": "L'adresse doit commencer par http:// ou https://, par exemple https://mura.example.org.",
    "bad_email": "Cela ne ressemble pas à une adresse e-mail.",
    "bad_port": "Le port doit être un nombre de 1 à 65535.",
    "bad_choice": "Tape un nombre de 1 à {count}.",
    "unstorable": "Cette valeur ne peut pas être écrite telle quelle dans .env (elle mêle une apostrophe à un $ ou à une barre oblique inverse). Choisis-en une autre.",
    "q_url": "À quelle adresse les gens atteindront-ils Mura ?",
    "why_url": (
        "C'est l'adresse que les gens tapent dans leur navigateur. Elle sert dans les liens des e-mails "
        "que Mura envoie (confirmer une adresse, changer un mot de passe, invitations), et c'est la seule "
        "adresse dont l'API accepte les requêtes. Pour un essai sur cette machine, garde la proposition. "
        "Pour une instance que d'autres utilisent, donne ton propre domaine en https:// : docs/https.fr.md explique comment."
    ),
    "q_admin": "Quelle est ton adresse e-mail ?",
    "why_admin": (
        "Une nouvelle instance n'a aucun compte. Le compte que tu crées avec cette adresse devient "
        "l'administrateur dès que tu saisis le code que Mura lui envoie par e-mail : prends donc une "
        "adresse que tu peux lire. Seul ce premier compte reçoit ce rôle, et seulement tant que "
        "l'instance n'a pas d'administrateur."
    ),
    "mail_intro": (
        "Mura envoie des e-mails : le code qui confirme chaque inscription, le lien d'un mot de passe "
        "oublié, les invitations et les notifications. Sans serveur d'e-mails, personne ne peut créer de "
        "compte, toi non plus. Mura ne livre pas les mails lui-même : il les confie à un serveur SMTP, celui "
        "de ton fournisseur. Il te faut donc un compte chez l'un d'eux. Si tu n'en as pas encore, "
        "docs/smtp.fr.md explique comment en obtenir un en quelques minutes."
    ),
    "provider_question": "Quel type de fournisseur utilises-tu ?",
    "provider_gmail": "Gmail   le plus rapide, pour un essai ou quelques personnes",
    "provider_brevo": "Brevo   un service d'envoi avec offre gratuite, pour une vraie instance",
    "provider_other": "Autre   la boîte mail de ton propre domaine, un autre service",
    "hint_gmail": (
        "Gmail n'accepte pas ton mot de passe habituel pour un programme : il faut un mot de passe "
        "d'application. Active la validation en deux étapes sur le compte Google, puis crée-en un sur "
        "https://myaccount.google.com/apppasswords (16 lettres, affichées une seule fois). Prends une "
        "adresse créée pour Mura plutôt que ta personnelle."
    ),
    "hint_brevo": (
        "Dans Brevo, ouvre SMTP et API et crée une clé SMTP. L'identifiant affiché là n'est pas toujours "
        "ton adresse e-mail, et le mot de passe est la clé, pas celui de ton compte. Valide aussi ton "
        "domaine d'expédition dans Brevo, sinon les mails finissent en spam."
    ),
    "hint_other": (
        "Cherche « paramètres SMTP » ou « configurer un client de messagerie » dans l'aide de ton "
        "hébergeur : elle donne le serveur et le port. L'identifiant est presque toujours l'adresse "
        "complète de la boîte."
    ),
    "q_host": "Serveur SMTP",
    "why_host": "L'adresse du serveur d'e-mails de ton fournisseur. Mura s'y connecte pour livrer chaque message.",
    "q_port": "Port SMTP",
    "why_port": (
        "Le 587 (la plupart des fournisseurs) démarre en clair puis passe en connexion chiffrée (STARTTLS) ; "
        "le 465 est chiffré dès le premier octet (SSL). Les deux sont sûrs, mais Mura doit savoir lequel : "
        "cet assistant règle MAIL_STARTTLS et MAIL_SSL pour toi d'après le port."
    ),
    "q_username": "Identifiant SMTP",
    "why_username": (
        "Ce qui te fait reconnaître par le serveur. Souvent ton adresse e-mail complète ; chez certains "
        "services, Brevo par exemple, c'est un identifiant à part affiché dans leurs réglages."
    ),
    "q_password": "Mot de passe SMTP (masqué pendant la saisie)",
    "why_password": (
        "Il prouve au serveur que tu as le droit d'envoyer. Il est saisi masqué, gardé seulement dans ton "
        ".env et jamais affiché. Chez Gmail et Brevo, ce n'est pas le mot de passe du compte mais un mot de "
        "passe d'application ou une clé SMTP : tu peux la révoquer quand tu veux sans changer celui du compte."
    ),
    "q_sender": "Expéditeur affiché sur les mails",
    "why_sender": (
        "Ce que voient, comme expéditeur, les personnes qui reçoivent un mail, par exemple "
        "Mura <mura@example.org>. Les fournisseurs n'acceptent qu'une adresse de ton compte ou d'un "
        "domaine que tu as validé chez eux : une autre est refusée ou envoie le message dans les indésirables."
    ),
    "test_ask": "Tester maintenant la connexion au serveur d'e-mails ?",
    "testing": "Connexion à {host}:{port} et identification (aucun mail n'est envoyé)…",
    "test_ok": "Le serveur a accepté la connexion et ton identifiant. Mura pourra envoyer ses e-mails.",
    "test_failed": "Impossible d'utiliser le serveur d'e-mails : {reason}.",
    "server_said": "Le serveur a répondu : {detail}",
    "reason_auth": "l'identifiant a été refusé",
    "reason_tls": "la connexion sécurisée a échoué",
    "reason_timeout": "le serveur n'a pas répondu à temps",
    "reason_dns": "le nom du serveur est inconnu",
    "reason_connect": "la connexion a été refusée ou coupée",
    "reason_other": "le serveur a répondu par une erreur",
    "fix_auth": (
        "Vérifie l'identifiant et le mot de passe. Chez Gmail et Brevo, le mot de passe est le mot de "
        "passe d'application ou la clé SMTP, pas celui du compte."
    ),
    "fix_tls": "Le port 587 va avec STARTTLS et le 465 avec SSL. Essaie l'autre port, et vérifie le nom du serveur.",
    "fix_timeout": (
        "Le port est peut-être bloqué. Beaucoup de réseaux bloquent l'envoi de mails : essaie l'autre "
        "port (587 ou 465) ou un autre réseau."
    ),
    "fix_dns": "Vérifie l'orthographe du serveur, par exemple smtp.gmail.com.",
    "fix_connect": "Vérifie le serveur et le port, et que ton réseau laisse passer les connexions sortantes.",
    "fix_other": "Lis la ligne ci-dessus : elle dit souvent ce qui ne va pas.",
    "retry_ask": "Ressaisir les réglages d'e-mails ?",
    "secrets_intro": (
        "Deux secrets sont générés maintenant, au hasard, et jamais affichés. JWT_SECRET signe chaque "
        "connexion : quiconque le connaît pourrait se connecter sous n'importe quel compte, d'où le refus "
        "de Mura de démarrer sans une valeur longue. Le mot de passe de la base protège tout ce que les gens "
        "mettent dans Mura. Les deux ne vivent que dans .env : garde ce fichier privé, et garde-en une "
        "copie avec tes sauvegardes (docs/backup.fr.md)."
    ),
    "row_url": "Adresse",
    "row_admin": "Administrateur",
    "row_server": "Serveur d'e-mails",
    "row_username": "Identifiant",
    "row_password": "Mot de passe",
    "row_sender": "Expéditeur",
    "row_secrets": "Secrets",
    "row_secrets_value": "générés, non affichés",
    "row_file": "Fichier",
    "confirm_write": "Écrire ce fichier ?",
    "nothing_written": "Rien n'a été écrit.",
    "written": "Le fichier est écrit.",
    "next_title": "Et maintenant ?",
    "next_start": "Démarre Mura depuis la racine du dépôt :",
    "next_logs": "Regarde le log du backend. Il doit dire que le serveur d'e-mails a répondu :",
    "next_register": "Ouvre {url}, choisis « Créer un compte » et inscris-toi avec {email}. Saisis le code reçu : tu es l'administrateur.",
    "next_more": (
        "Pour une instance que d'autres utilisent, mets aussi en place le HTTPS (docs/https.fr.md) et "
        "les sauvegardes (docs/backup.fr.md), et renseigne les réglages VITE_LEGAL_* de .env, dont les pages légales ont besoin."
    ),
    "exists": "{path} existe déjà.",
    "overwrite_ask": "Le remplacer ? Le mot de passe de la base va changer, ce qui casse une base déjà créée.",
    "nothing_changed": "Rien n'a été modifié.",
    "cancelled": "Annulé. Aucun fichier écrit.",
    "yes_letters": ("o", "oui", "y"),
    "no_letters": ("n", "non"),
}

if __name__ == "__main__":
    sys.exit(run(TEXTS))
