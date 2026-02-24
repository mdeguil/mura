# 🟦 Mura

> A modern, open-source project management tool — inspired by Trello.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
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

### Prerequisites

- [Docker](https://www.docker.com/) & Docker Compose
- Or manually: Java 21+, Node.js 20+, PostgreSQL 15+

### Run with Docker (recommended)

```bash
git clone https://github.com/YOUR_USERNAME/mura.git
cd mura
cp .env.example .env
docker compose up
```

The app will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080
- **API Docs (Swagger)**: http://localhost:8080/swagger-ui.html

### Run manually

See [docs/setup.md](docs/setup.md) for manual setup instructions.

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

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
