# Créer un service SMTP pour Mura

[English](smtp.md) | **Français**

Mura envoie des e-mails : le code qui confirme chaque inscription, le lien d'un mot de passe oublié, les invitations et les notifications. Sans serveur d'envoi, personne ne peut créer de compte, toi non plus. Ce guide explique ce qu'est un service SMTP, comment en obtenir un et quoi mettre dans `.env`.

## En deux mots

**SMTP** est le protocole d'envoi des e-mails. Mura ne sait pas envoyer un mail tout seul jusqu'à la boîte de quelqu'un : il le confie à un serveur SMTP, celui d'un fournisseur, qui se charge de la livraison. Ce serveur te demande de t'identifier avec un identifiant et un mot de passe, et n'accepte que les adresses d'expéditeur qui t'appartiennent.

Il te faut donc **un compte chez un fournisseur qui propose l'envoi SMTP**. Il y a trois façons d'en avoir un.

| Solution | Pour qui | À savoir |
|---|---|---|
| **Un service d'envoi** (Brevo, Mailjet, Resend…) | Une instance ouverte à d'autres personnes | Gratuit jusqu'à un certain volume. C'est son métier : les mails arrivent bien dans les boîtes. Demande un domaine. |
| **La boîte mail de ton nom de domaine** (chez OVH, Infomaniak, Gandi…) | Tu as déjà un domaine avec des adresses mail | Rien de plus à ouvrir : tu réutilises une adresse existante. |
| **Gmail** | Un essai, ou un petit groupe de proches | Le plus rapide, mais limité à environ 500 mails par jour, et l'expéditeur reste ton adresse Gmail. |

Dans les trois cas, tu finis avec les mêmes cinq informations : un **serveur**, un **port**, un **identifiant**, un **mot de passe** et une **adresse d'expéditeur**.

## Ce qu'il faut mettre dans `.env`

| Variable | Valeur |
|---|---|
| `MAIL_HOST` | Le serveur SMTP du fournisseur, par exemple `smtp.gmail.com` |
| `MAIL_PORT` | `587` la plupart du temps, ou `465` |
| `MAIL_STARTTLS` | `true` avec le port 587, `false` avec le 465 |
| `MAIL_SSL` | `true` avec le port 465, `false` avec le 587 |
| `MAIL_USERNAME` | L'identifiant SMTP, souvent l'adresse mail complète |
| `MAIL_PASSWORD` | Le mot de passe SMTP, voir ci-dessous : ce n'est pas toujours celui du compte |
| `MURA_MAIL_FROM` | L'expéditeur que les gens voient, par exemple `Mura <mura@example.org>` |

Le script `scripts/configurer_env.py` pose ces questions et choisit seul `STARTTLS` ou `SSL` d'après le port. Tu peux aussi remplir `.env` à la main.

Le fichier `.env` contient ton mot de passe SMTP : il n'est jamais envoyé sur GitHub (`.gitignore` l'exclut), ne le partage pas.

## Option 1 : un service d'envoi (Brevo)

Brevo (ex-Sendinblue) a une offre gratuite limitée à quelques centaines de mails par jour, largement suffisante pour une équipe. Les autres services (Mailjet, Resend, Scaleway…) fonctionnent de la même façon : seuls les noms changent. Vérifie les limites actuelles sur leur site.

1. **Crée un compte** sur brevo.com.
2. **Déclare ton expéditeur.** Dans les réglages d'expéditeurs et de domaines, ajoute ton nom de domaine et valide-le en ajoutant chez ton registraire les enregistrements DNS que Brevo affiche. Sans cela, les mails partent mais finissent en spam, voir [Pour que les mails arrivent](#pour-que-les-mails-arrivent).
3. **Génère une clé SMTP.** Dans *SMTP et API*, onglet *SMTP*, crée une clé. Brevo affiche alors tout ce qu'il te faut.
4. **Reporte-le dans `.env` :**

   ```
   MAIL_HOST=smtp-relay.brevo.com
   MAIL_PORT=587
   MAIL_STARTTLS=true
   MAIL_SSL=false
   MAIL_USERNAME=<l'identifiant SMTP affiché par Brevo>
   MAIL_PASSWORD=<la clé SMTP>
   MURA_MAIL_FROM=Mura <mura@ton-domaine.fr>
   ```

   L'identifiant SMTP de Brevo n'est pas forcément ton adresse mail : copie celui qui s'affiche sur la page. Le mot de passe est la clé SMTP générée, pas le mot de passe de ton compte Brevo.

## Option 2 : la boîte mail de ton domaine

Si ton domaine est chez un hébergeur qui fournit des boîtes mail, tu peux envoyer depuis l'une d'elles.

1. **Crée une adresse dédiée**, par exemple `mura@ton-domaine.fr`, dans l'espace client de l'hébergeur. Une adresse à part évite de mélanger tes mails et ceux de Mura.
2. **Cherche dans l'aide de l'hébergeur** la page « paramètres SMTP » ou « configurer un client de messagerie » : elle donne le serveur et le port.
3. **Reporte-les dans `.env`.** L'identifiant est presque toujours l'adresse complète, et le mot de passe celui de cette boîte. `MURA_MAIL_FROM` reprend la même adresse :

   ```
   MAIL_HOST=<le serveur SMTP de l'hébergeur>
   MAIL_PORT=465
   MAIL_STARTTLS=false
   MAIL_SSL=true
   MAIL_USERNAME=mura@ton-domaine.fr
   MAIL_PASSWORD=<le mot de passe de la boîte>
   MURA_MAIL_FROM=Mura <mura@ton-domaine.fr>
   ```

   Utilise `587` avec `MAIL_STARTTLS=true` si l'hébergeur le propose plutôt que le 465.

## Option 3 : Gmail, pour un essai

Gmail n'accepte pas ton mot de passe habituel pour l'envoi par un programme. Il faut un **mot de passe d'application**, et pour en créer un, la validation en deux étapes doit être activée sur le compte.

1. **Active la validation en deux étapes** sur ton compte Google (myaccount.google.com, rubrique *Sécurité*).
2. **Crée un mot de passe d'application** à l'adresse myaccount.google.com/apppasswords. Donne-lui un nom, par exemple « Mura ». Google affiche un code de 16 lettres, **une seule fois**. Un compte Google Workspace peut avoir cette option désactivée par son administrateur.
3. **Reporte-le dans `.env`**, sans les espaces du code :

   ```
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_STARTTLS=true
   MAIL_SSL=false
   MAIL_USERNAME=ton.adresse@gmail.com
   MAIL_PASSWORD=<le mot de passe d'application>
   MURA_MAIL_FROM=Mura <ton.adresse@gmail.com>
   ```

Deux précautions :

- **Utilise une adresse Gmail créée pour Mura**, pas ton adresse personnelle : les invitations et les notifications partent de là.
- **Ne partage jamais le mot de passe d'application**, ni dans un message, ni dans un ticket, ni sur GitHub. S'il a fuité, supprime-le sur la page des mots de passe d'application : il cesse de fonctionner immédiatement, et tu en crées un autre.

## Pour que les mails arrivent

Un fournisseur qui accepte tes mails ne garantit pas qu'ils arrivent dans la boîte de réception. Avec un domaine à toi (options 1 et 2), trois enregistrements DNS prouvent aux destinataires que l'expéditeur est légitime :

- **SPF** : la liste des serveurs autorisés à envoyer pour ton domaine ;
- **DKIM** : une signature ajoutée à chaque mail ;
- **DMARC** : ce que le destinataire doit faire d'un mail qui ne passe pas les deux premiers contrôles.

Le fournisseur te donne les valeurs exactes à ajouter chez ton registraire ; il suffit de les copier. Pour vérifier le résultat, envoie-toi un mail depuis Mura puis regarde son score sur mail-tester.com.

Avec Gmail, rien à régler : Google signe lui-même ses mails.

## Vérifier que Mura arrive à envoyer

Après avoir rempli `.env`, redémarre :

```
docker compose up -d
docker compose logs backend
```

Le log doit dire `Mail server … answered; Mura can send its mails.` Sinon, la ligne `Mura cannot reach the mail server` nomme le serveur et la raison :

| Raison | Piste |
|---|---|
| `Authentication failed` ou `535` | Identifiant ou mot de passe faux. Chez Gmail et Brevo, le mot de passe n'est pas celui du compte, c'est le mot de passe d'application ou la clé SMTP. |
| `Connection timed out` | Mauvais serveur, ou port bloqué. Essaie l'autre port (587 ou 465), et vérifie que ton hébergeur ou ta box ne bloque pas les connexions sortantes. |
| `SSL` / `handshake` / `StartTLS` | La combinaison est fausse : 587 va avec `MAIL_STARTTLS=true`, 465 avec `MAIL_SSL=true`, jamais les deux. |
| `Sender address rejected` (n'apparaît pas au démarrage, mais au premier envoi, dans le même log) | L'expéditeur de `MURA_MAIL_FROM` n'est pas une adresse du compte ou du domaine validé chez le fournisseur. |

Le test final : crée un compte avec l'adresse de `MURA_ADMIN_EMAIL`. Le code doit arriver dans la minute. S'il n'est pas dans la boîte de réception, regarde les courriers indésirables, puis la section précédente.

## Pour un essai sur ta machine

Pour développer ou essayer Mura sans fournisseur, Mailpit intercepte les mails au lieu de les envoyer et les montre sur http://localhost:8025. Il se règle avec `SPRING_PROFILES_ACTIVE=dev` et `COMPOSE_PROFILES=dev` et en laissant les réglages `MAIL_` vides, comme l'explique [setup.fr.md](setup.fr.md). Il ne convient pas à une instance que d'autres utilisent, puisque rien n'arrive jamais dans une vraie boîte.
