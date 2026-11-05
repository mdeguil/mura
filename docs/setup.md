# Setup Guide

Mura runs as four Docker containers: PostgreSQL, the Spring Boot backend, the React frontend served by nginx, and, for development only, Mailpit. People reach the frontend; nginx forwards `/api` to the backend, which is never exposed on its own.

## Prerequisites

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) with Docker Compose 2.24 or later
- An SMTP account to send mail from (your mail provider, or a transactional service)

To work on the code without Docker: Java 21, Maven 3.9, Node.js 20 and PostgreSQL 15.

---

## Installing an instance

### 1. Get the code and the settings file

```bash
git clone https://github.com/mdeguil/mura.git
cd mura
cp .env.example .env
```

### 2. Fill in `.env`

Every setting is described in `.env.example`; these are the ones an instance needs.

| Setting | What to put |
|---|---|
| `JWT_SECRET` | A random value of at least 32 characters, for example `openssl rand -base64 48`. It signs every sign-in: the backend refuses to start without one, or on the example value. |
| `POSTGRES_PASSWORD`, `SPRING_DATASOURCE_PASSWORD` | The same new password for the database. PostgreSQL only reads it when the database is first created: to change it later, see [Useful commands](#useful-commands). |
| `MURA_URL` | The address people type, without a trailing path: `https://mura.example.org`. Links in e-mails point there. Empty means `http://localhost:5173`, which only suits a trial on your own machine. |
| `MURA_ADMIN_EMAIL` | Your address. A new instance has no account; the one created with this address becomes the administrator once its code is entered, as long as the instance has no administrator. |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD` | Your SMTP server. Usually port 587 with `MAIL_STARTTLS=true`, or 465 with `MAIL_SSL=true`. |
| `MURA_MAIL_FROM` | The sender people see, for example `Mura <mura@example.org>`. Most providers only accept an address of a domain they send for. |
| `VITE_LEGAL_*` | Who runs the instance and who hosts it, for the *Mentions légales* and the privacy policy. Required by French law as soon as the instance is open to other people; may stay empty for a private install. |

Leave `SPRING_PROFILES_ACTIVE` and `COMPOSE_PROFILES` empty: `dev` is for working on Mura, and it adds demo accounts with a public password.

### 3. Start

```bash
docker compose up -d --build
```

The first build takes a few minutes. Then check the backend's log:

```bash
docker compose logs backend
```

It should show `Started MuraApplication` and `Mail server … answered; Mura can send its mails.` A line saying `Mura cannot reach the mail server` names the setting to check.

### 4. Create the administrator

Open `MURA_URL`, choose *Créer un compte* and register with the address in `MURA_ADMIN_EMAIL`. Enter the code you receive by e-mail: the account is now the administrator, and the *Administration* page appears in the top bar. Other administrators are named from there.

### 5. HTTPS, backups

- An instance other people use must be served over HTTPS: [https.md](https.md) sets it up with one line in `.env`.
- Set up daily backups before anyone relies on the instance: [sauvegarde.md](sauvegarde.md), which also explains updates.

---

## Working on Mura

### With Docker

In `.env`, set

```
SPRING_PROFILES_ACTIVE=dev
COMPOSE_PROFILES=dev
```

and leave the `MAIL_` settings empty. Then `docker compose up -d --build` starts:

- the demo accounts `alice@mura.dev`, `bob@mura.dev` and `admin@mura.dev`, password `password123`;
- Mailpit, which catches every mail, at http://localhost:8025;
- the API documentation at http://localhost:8080/swagger-ui.html;
- detailed logs from the backend.

`JWT_SECRET` is required in development too.

### Frontend with live reload

With the database and backend running in Docker as above:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server answers on http://localhost:5173 and forwards `/api` to the backend on port 8080. Stop the `frontend` container first if it is running, since both use port 5173: `docker compose stop frontend`.

### Backend without Docker

```bash
cd backend
SPRING_PROFILES_ACTIVE=dev JWT_SECRET=$(openssl rand -base64 48) mvn spring-boot:run
```

It expects PostgreSQL on `localhost:5432` (database, user and password `mura` / `mura` / `changeme`, or the `SPRING_DATASOURCE_*` variables) and an SMTP server on `localhost:1025`, which the Mailpit container provides.

---

## Useful commands

```bash
# Backend tests
cd backend && mvn test

# Frontend lint, tests and build
cd frontend && npm run lint && npm test && npm run build

# Follow the logs of every container
docker compose logs -f

# Change the database password after the first start
docker compose exec db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "ALTER USER $POSTGRES_USER PASSWORD '"'"'new-password'"'"'"'
# then put the same value in POSTGRES_PASSWORD and SPRING_DATASOURCE_PASSWORD, and run docker compose up -d

# Erase everything, database included (development only)
docker compose down -v
```
