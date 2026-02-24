# Setup Guide

## Prerequisites

- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) & Docker Compose v2+

Or for manual setup:
- Java 21+
- Maven 3.9+
- Node.js 20+ & npm
- PostgreSQL 15+

---

## Quick Start (Docker)

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/mura.git
cd mura

# 2. Configure environment
cp .env.example .env
# Edit .env if needed (default values work for local dev)

# 3. Start everything
docker compose up --build

# App is running at:
# Frontend  → http://localhost:5173
# Backend   → http://localhost:8080
# Swagger   → http://localhost:8080/swagger-ui.html
```

---

## Manual Setup

### Database

```bash
psql -U postgres -c "CREATE USER mura WITH PASSWORD 'changeme';"
psql -U postgres -c "CREATE DATABASE mura OWNER mura;"
```

### Backend

```bash
cd backend
cp src/main/resources/application.yml.example src/main/resources/application.yml
# Edit datasource config if needed

mvn spring-boot:run
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Set VITE_API_URL=http://localhost:8080/api

npm install
npm run dev
```

---

## Useful commands

```bash
# Run backend tests
cd backend && mvn test

# Lint frontend
cd frontend && npm run lint

# Reset database (Docker)
docker compose down -v && docker compose up
```
