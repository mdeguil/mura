# Architecture

[English](architecture.md) | **Français**

## Vue d'ensemble

Mura suit une architecture client/serveur classique, avec un frontend et un backend découplés.

```
┌─────────────────┐        ┌──────────────────────┐        ┌────────────┐
│  React (Vite)   │──HTTP──│  Spring Boot REST API │──JPA───│ PostgreSQL │
│  + Tailwind CSS │        │  + Spring Security    │        │            │
│  + Zustand      │        │  + Flyway             │        │            │
└─────────────────┘        └──────────────────────┘        └────────────┘
```

## Backend (Spring Boot)

Les paquets sont organisés **par fonctionnalité**, pas par couche :

- `board/` — CRUD des tableaux, gestion des membres
- `list/` — gestion et réordonnancement des listes
- `card/` — cartes, étiquettes, membres, échéances
- `member/` — profils des utilisateurs
- `common/` — configuration JWT, sécurité, gestion des exceptions, entités de base

Chaque fonctionnalité contient : `Entity`, `Repository`, `Service`, `Controller`, `DTO`.

## Frontend (React)

- **Routage** : React Router v6
- **État** : Zustand (léger, sans code superflu)
- **Appels d'API** : Axios avec un intercepteur JWT
- **Glisser-déposer** : @hello-pangea/dnd (fork maintenu de react-beautiful-dnd)
- **Style** : Tailwind CSS

## Authentification

Authentification par JWT :
1. L'utilisateur se connecte → le backend renvoie un JWT signé
2. Le frontend garde le JWT dans le localStorage via Zustand persist
3. L'intercepteur Axios ajoute automatiquement `Authorization: Bearer <token>` à toutes les requêtes
4. Une réponse 401 déclenche la déconnexion automatique et la redirection vers `/login`

## Migrations de la base

Tout changement de schéma passe par des migrations **Flyway** dans `backend/src/main/resources/db/migration/`.  
Convention de nommage : `V{version}__{description}.sql` (par exemple `V2__add_card_attachments.sql`)
