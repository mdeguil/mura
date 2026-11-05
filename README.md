# 🟦 Mura

> A modern, self-hosted project management tool — inspired by Trello.

![License](https://img.shields.io/badge/license-Mura%201.0-blue.svg)
![Backend](https://img.shields.io/badge/backend-Spring%20Boot-green.svg)
![Frontend](https://img.shields.io/badge/frontend-React-61DAFB.svg)
![Database](https://img.shields.io/badge/database-PostgreSQL-336791.svg)

## ✨ Features

- 📋 **Boards** — Organize your projects into boards
- 📝 **Lists & Cards** — Break down tasks into lists and cards
- 🏷️ **Labels** — Categorize cards with color-coded labels
- 👥 **Members** — Invite members to boards and assign cards
- 📅 **Due Dates** — Set deadlines on cards
- 🔒 **Authentication** — Secure login with JWT

## 🚀 Getting Started

Mura is installed by the people who use it, on their own machine or server, with Docker.

### Prerequisites

- [Docker](https://www.docker.com/) with Docker Compose 2.24 or later
- A mail account that can send through SMTP: sign-up confirms every address with a code sent by e-mail
- For an instance other people use: a domain name pointing at the server, for HTTPS

### Install

```bash
git clone https://github.com/mdeguil/mura.git
cd mura
cp .env.example .env
```

Then fill in `.env` — each setting is explained there:

- `JWT_SECRET`: a random value, for example from `openssl rand -base64 48`. The backend refuses to start without one.
- `POSTGRES_PASSWORD` and `SPRING_DATASOURCE_PASSWORD`: the same new password, in place of `changeme`.
- `MURA_URL`: the address people will type, for example `https://mura.example.org`.
- `MURA_ADMIN_EMAIL`: your own address. The account you create with it becomes the administrator.
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_STARTTLS` and `MURA_MAIL_FROM`: your mail provider's SMTP settings.

Start Mura:

```bash
docker compose up -d --build
docker compose logs backend
```

The log should say `Mail server … answered`. Open `MURA_URL` (http://localhost:5173 if left empty), create your account with `MURA_ADMIN_EMAIL` and enter the code you receive: you are the administrator.

Then:

- **HTTPS**, needed as soon as other people use the instance: [docs/https.md](docs/https.md)
- **Backups and updates**: [docs/sauvegarde.md](docs/sauvegarde.md)
- **Every setting, and working on Mura itself**: [docs/setup.md](docs/setup.md)

## 🏗️ Architecture

```
mura/
├── backend/    # Spring Boot REST API
├── frontend/   # React + TypeScript SPA
└── docs/       # Documentation
```

See [docs/architecture.md](docs/architecture.md) for a detailed overview.

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before submitting a PR.

## 📄 License

Mura is free to install and use, for yourself or within your organisation, but its code may not be modified, redistributed or sold without the author's permission — see the [LICENSE](LICENSE) file (in French) for the exact terms. Versions published before this licence remain under the MIT License.
