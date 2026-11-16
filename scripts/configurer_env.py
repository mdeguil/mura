#!/usr/bin/env python3
"""Crée le fichier .env de Mura en posant quelques questions.

Le script part de .env.example, remplit les valeurs demandées, génère seul
les secrets (JWT_SECRET et mot de passe de la base) et écrit le fichier à la
racine du dépôt. Il n'utilise que la bibliothèque standard de Python.

Usage :
    python3 scripts/configurer_env.py                 # écrit .env à la racine
    python3 scripts/configurer_env.py --sortie test.env
"""

import argparse
import base64
import getpass
import os
import re
import secrets
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
EXEMPLE = RACINE / ".env.example"
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def demander(question, defaut=None, obligatoire=True, valider=None):
    """Pose une question jusqu'à obtenir une réponse valide."""
    suffixe = f" [{defaut}]" if defaut else ""
    while True:
        reponse = input(f"{question}{suffixe} : ").strip()
        if not reponse and defaut is not None:
            reponse = defaut
        if not reponse:
            if obligatoire:
                print("  Cette valeur est obligatoire.")
                continue
            return ""
        if valider is None:
            return reponse
        erreur = valider(reponse)
        if erreur is None:
            return reponse
        print(f"  {erreur}")


def valider_url(valeur):
    if not re.match(r"^https?://[^\s/]+", valeur):
        return "L'adresse doit commencer par http:// ou https:// (exemple : https://mura.example.org)."
    return None


def valider_email(valeur):
    if not EMAIL_RE.match(valeur):
        return "Adresse mail invalide."
    return None


def valider_port(valeur):
    if not valeur.isdigit() or not (1 <= int(valeur) <= 65535):
        return "Le port doit être un nombre entre 1 et 65535."
    return None


def valider_texte(valeur):
    return None


def charger_exemple():
    if not EXEMPLE.exists():
        sys.exit(f"Fichier introuvable : {EXEMPLE}")
    return EXEMPLE.read_text(encoding="utf-8").splitlines()


def generer_secret_jwt():
    # Le guide demande une valeur d'au moins 32 caractères (openssl rand -base64 48).
    return base64.b64encode(os.urandom(48)).decode("ascii")


def generer_mot_de_passe_base():
    # Caractères sûrs pour une valeur d'environnement et pour la commande psql du guide.
    return secrets.token_urlsafe(24)


def poser_questions():
    print("Configuration de Mura\n")
    print("Appuie sur Entrée pour garder la valeur proposée entre crochets.\n")

    valeurs = {}

    print("— L'instance —")
    valeurs["MURA_URL"] = demander(
        "Adresse de l'instance (ex. https://mura.example.org, ou http://localhost:5173 pour un essai)",
        defaut="http://localhost:5173",
        valider=valider_url,
    ).rstrip("/")
    valeurs["MURA_ADMIN_EMAIL"] = demander(
        "Ton adresse mail (elle deviendra administrateur)",
        valider=valider_email,
    )

    print("\n— Mail (obligatoire : sans serveur mail, personne ne peut s'inscrire) —")
    hote = demander("Serveur SMTP (ex. smtp.gmail.com)", valider=valider_texte)
    port = demander(
        "Port SMTP (587 la plupart du temps, 465 en SSL)",
        defaut="587",
        valider=valider_port,
    )
    utilisateur = demander("Identifiant SMTP (souvent ton adresse mail)", valider=valider_texte)
    mot_de_passe = getpass.getpass("Mot de passe SMTP (saisie masquée) : ").strip()
    if not mot_de_passe:
        sys.exit("Le mot de passe SMTP est obligatoire.")
    expediteur = demander(
        "Expéditeur affiché (ex. Mura <mura@ton-domaine.fr>)",
        defaut=f"Mura <{utilisateur}>" if EMAIL_RE.match(utilisateur) else None,
        valider=valider_texte,
    )

    # Port 465 : SSL direct. Autres ports (587) : STARTTLS.
    en_ssl = port == "465"
    valeurs.update(
        {
            "MAIL_HOST": hote,
            "MAIL_PORT": port,
            "MAIL_USERNAME": utilisateur,
            "MAIL_PASSWORD": mot_de_passe,
            "MAIL_STARTTLS": "false" if en_ssl else "true",
            "MAIL_SSL": "true" if en_ssl else "false",
            "MURA_MAIL_FROM": expediteur,
        }
    )
    return valeurs


def construire_fichier(valeurs_saisies):
    """Reprend .env.example ligne à ligne et remplit les valeurs connues."""
    mot_de_passe_base = generer_mot_de_passe_base()
    valeurs = {
        **valeurs_saisies,
        "JWT_SECRET": generer_secret_jwt(),
        "POSTGRES_PASSWORD": mot_de_passe_base,
        "SPRING_DATASOURCE_PASSWORD": mot_de_passe_base,
        # Laissés vides pour une installation réelle (voir docs/setup.md).
        "SPRING_PROFILES_ACTIVE": "",
        "COMPOSE_PROFILES": "",
    }

    sortie = []
    cles_ecrites = set()
    for ligne in charger_exemple():
        correspondance = re.match(r"^([A-Z_][A-Z0-9_]*)=", ligne)
        if correspondance and correspondance.group(1) in valeurs:
            cle = correspondance.group(1)
            sortie.append(f"{cle}={valeurs[cle]}")
            cles_ecrites.add(cle)
        else:
            sortie.append(ligne)

    manquantes = set(valeurs) - cles_ecrites
    if manquantes:
        sortie.append("")
        sortie.append("# Ajoutées par scripts/configurer_env.py")
        sortie.extend(f"{cle}={valeurs[cle]}" for cle in sorted(manquantes))

    return "\n".join(sortie) + "\n"


def main():
    parser = argparse.ArgumentParser(description="Crée le fichier .env de Mura.")
    parser.add_argument(
        "--sortie",
        type=Path,
        default=RACINE / ".env",
        help="fichier à écrire (par défaut : .env à la racine du dépôt)",
    )
    args = parser.parse_args()

    if args.sortie.exists():
        reponse = input(
            f"{args.sortie} existe déjà. L'écraser ? Le mot de passe de la base "
            "sera changé, ce qui casse une base déjà créée (o/N) : "
        ).strip().lower()
        if reponse not in ("o", "oui", "y", "yes"):
            sys.exit("Aucune modification.")

    try:
        valeurs = poser_questions()
    except (KeyboardInterrupt, EOFError):
        sys.exit("\nAnnulé. Aucun fichier écrit.")

    args.sortie.write_text(construire_fichier(valeurs), encoding="utf-8")
    try:
        os.chmod(args.sortie, 0o600)
    except OSError:
        pass

    print(f"\nFichier écrit : {args.sortie}")
    print("Les secrets (JWT_SECRET, mot de passe de la base) ont été générés et ne sont pas affichés.")
    print("\nÉtape suivante, depuis la racine du dépôt :")
    print("    docker compose up -d --build")
    print("    docker compose logs backend")


if __name__ == "__main__":
    main()
