# Guide d'installation

[English](../en/setup.md) | **Français**

Mura tourne dans quatre conteneurs Docker : PostgreSQL, le backend Spring Boot, le frontend React servi par nginx et, pour le développement seulement, Mailpit. Les gens atteignent le frontend ; nginx transmet `/api` au backend, qui n'est jamais exposé seul.

## Ce qu'il faut

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) avec Docker Compose 2.24 ou plus récent
- Un compte SMTP pour envoyer les e-mails (ton fournisseur de messagerie, ou un service d'envoi) ; [smtp.md](smtp.md) explique comment en obtenir un

Pour travailler sur le code sans Docker : Java 21, Maven 3.9, Node.js 20 et PostgreSQL 15.

---

## Installer une instance

### 1. Récupérer le code et le fichier de réglages

```bash
git clone https://github.com/mdeguil/mura.git
cd mura
cp .env.example .env
```

### 2. Remplir `.env`

Le plus simple est `python3 scripts/configurer_env.py` (`py` sous Windows ; `scripts/configure_env.py` est la version anglaise) : il demande ce qui suit, explique à quoi sert chaque réponse, génère les secrets et peut tester le serveur d'e-mails. Le tableau ci-dessous sert à remplir le fichier à la main, ou à vérifier ce que l'assistant a écrit.

À faire avant le premier `docker compose up` : la base est créée au premier démarrage, avec le mot de passe que `.env` contient à ce moment-là. Chaque réglage est décrit dans `.env.example` ; voici ceux dont une instance a besoin.

| Réglage | Quoi mettre |
|---|---|
| `JWT_SECRET` | Une valeur aléatoire d'au moins 32 caractères, par exemple `openssl rand -base64 48`. Elle signe chaque connexion : le backend refuse de démarrer sans elle, ou avec la valeur d'exemple. |
| `POSTGRES_PASSWORD`, `SPRING_DATASOURCE_PASSWORD` | Le même nouveau mot de passe pour la base. PostgreSQL ne le lit qu'à la création de la base : pour le changer ensuite, voir [Commandes utiles](#commandes-utiles). |
| `MURA_URL` | L'adresse que les gens tapent, sans chemin à la fin : `https://mura.example.org`. Les liens des e-mails y mènent. Vide, c'est `http://localhost:5173`, qui ne convient qu'à un essai sur ta propre machine. |
| `MURA_ADMIN_EMAIL` | Ton adresse. Une nouvelle instance n'a aucun compte ; celui créé avec cette adresse devient l'administrateur une fois son code saisi, tant que l'instance n'a pas d'administrateur. |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | Ton serveur SMTP. En général le port 587 avec `MAIL_STARTTLS=true`, ou le 465 avec `MAIL_SSL=true`. |
| `MURA_MAIL_FROM` | L'expéditeur que les gens voient, par exemple `Mura <mura@example.org>`. La plupart des fournisseurs n'acceptent qu'une adresse d'un domaine pour lequel ils envoient. |
| `VITE_LEGAL_*` | Qui gère l'instance et qui l'héberge, pour les *Mentions légales* et la politique de confidentialité. Exigé par la loi française dès que l'instance est ouverte à d'autres personnes ; peut rester vide pour une installation privée. |

Laisse `SPRING_PROFILES_ACTIVE` et `COMPOSE_PROFILES` vides : `dev` sert à travailler sur Mura, et il ajoute des comptes de démonstration au mot de passe public.

### 3. Démarrer

```bash
docker compose up -d --build
```

La première construction prend quelques minutes. Regarde ensuite le log du backend :

```bash
docker compose logs backend
```

Il doit afficher `Started MuraApplication` et `Mail server … answered; Mura can send its mails.` Sinon :

| Le log dit | Ce que ça veut dire |
|---|---|
| `JWT_SECRET is not set`, `is still the example value` ou `is shorter than 32 bytes` | Renseigne `JWT_SECRET` comme à l'étape 2, puis `docker compose up -d`. |
| `password authentication failed for user "mura"` | La base a été créée à un démarrage précédent, avec un autre mot de passe que celui de `.env` maintenant. Sur une nouvelle installation qui ne contient encore rien : `docker compose down -v` puis `docker compose up -d` (`-v` efface la base). Sur une instance en service : change le mot de passe comme dans [Commandes utiles](#commandes-utiles). |
| `Mura cannot reach the mail server` | La ligne nomme le serveur et la raison ; vérifie les réglages `MAIL_`, puis `docker compose up -d`. |
| `This instance has no administrator` | Renseigne `MURA_ADMIN_EMAIL`, puis `docker compose up -d`, et passe à l'étape 4. |

### 4. Créer l'administrateur

Ouvre `MURA_URL`, choisis *Créer un compte* (*Create an account* si l'interface est en anglais) et inscris-toi avec l'adresse de `MURA_ADMIN_EMAIL`. Saisis le code reçu par e-mail : le compte devient administrateur, et la page *Administration* apparaît dans la barre du haut. Les autres administrateurs se nomment depuis cette page.

### 5. HTTPS, sauvegardes

- Une instance que d'autres personnes utilisent doit être servie en HTTPS : [https.md](https.md) le met en place avec une ligne dans `.env`.
- Mets en place des sauvegardes quotidiennes avant que quiconque compte sur l'instance : [backup.md](backup.md), qui explique aussi les mises à jour.

---

## Travailler sur Mura

### Avec Docker

Dans `.env`, renseigne

```
SPRING_PROFILES_ACTIVE=dev
COMPOSE_PROFILES=dev
```

et laisse les réglages `MAIL_` vides. Puis `docker compose up -d --build` démarre :

- les comptes de démonstration `alice@mura.dev`, `bob@mura.dev` et `admin@mura.dev`, mot de passe `password123` ;
- Mailpit, qui intercepte tous les e-mails, sur http://localhost:8025 ;
- la documentation de l'API sur http://localhost:8080/swagger-ui.html ;
- des logs détaillés du backend.

`JWT_SECRET` est aussi obligatoire en développement.

### Le frontend avec rechargement à chaud

Avec la base et le backend lancés dans Docker comme ci-dessus :

```bash
cd frontend
npm install
npm run dev
```

Le serveur de développement Vite répond sur http://localhost:5173 et transmet `/api` au backend sur le port 8080. Arrête d'abord le conteneur `frontend` s'il tourne, puisque les deux utilisent le port 5173 : `docker compose stop frontend`.

### Le backend sans Docker

```bash
cd backend
SPRING_PROFILES_ACTIVE=dev JWT_SECRET=$(openssl rand -base64 48) mvn spring-boot:run
```

Il attend PostgreSQL sur `localhost:5432` (base, utilisateur et mot de passe `mura` / `mura` / `changeme`, ou les variables `SPRING_DATASOURCE_*`) et un serveur SMTP sur `localhost:1025`, que le conteneur Mailpit fournit.

---

## Commandes utiles

```bash
# Tests du backend
cd backend && mvn test

# Lint, tests et build du frontend
cd frontend && npm run lint && npm test && npm run build

# Suivre les logs de tous les conteneurs
docker compose logs -f

# Changer le mot de passe de la base après le premier démarrage
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "ALTER USER $POSTGRES_USER PASSWORD '"'"'nouveau-mot-de-passe'"'"'"'
# puis mets la même valeur dans POSTGRES_PASSWORD et SPRING_DATASOURCE_PASSWORD, et lance docker compose up -d

# Tout effacer, base comprise (développement seulement)
docker compose down -v
```
