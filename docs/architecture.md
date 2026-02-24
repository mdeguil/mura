# Architecture

## Overview

Mura follows a classic client/server architecture with a decoupled frontend and backend.

```
┌─────────────────┐        ┌──────────────────────┐        ┌────────────┐
│  React (Vite)   │──HTTP──│  Spring Boot REST API │──JPA───│ PostgreSQL │
│  + Tailwind CSS │        │  + Spring Security    │        │            │
│  + Zustand      │        │  + Flyway             │        │            │
└─────────────────┘        └──────────────────────┘        └────────────┘
```

## Backend (Spring Boot)

Packages are organized **by feature**, not by layer:

- `board/` — Board CRUD, member management
- `list/` — List management and reordering
- `card/` — Cards, labels, members, due dates
- `member/` — User profiles
- `common/` — JWT config, security, exception handling, base entities

Each feature contains: `Entity`, `Repository`, `Service`, `Controller`, `DTO`.

## Frontend (React)

- **Routing**: React Router v6
- **State**: Zustand (lightweight, no boilerplate)
- **API calls**: Axios with JWT interceptor
- **Drag & drop**: @hello-pangea/dnd (maintained fork of react-beautiful-dnd)
- **Styling**: Tailwind CSS

## Authentication

JWT-based auth:
1. User logs in → backend returns a signed JWT
2. Frontend stores JWT in localStorage via Zustand persist
3. Axios interceptor automatically adds `Authorization: Bearer <token>` to all requests
4. 401 responses trigger automatic logout and redirect to `/login`

## Database migrations

All schema changes go through **Flyway** migrations in `backend/src/main/resources/db/migration/`.  
Naming convention: `V{version}__{description}.sql` (e.g. `V2__add_card_attachments.sql`)
