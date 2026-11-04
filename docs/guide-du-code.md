# Guide du code de Mura

Ce guide explique comment le code est rangé et les quelques règles maison qu'il suit, pour pouvoir y ajouter une fonctionnalité sans tout relire. Pour installer et lancer l'application, voir [setup.md](setup.md). Pour les couleurs et les composants visuels, voir [charte-graphique.md](charte-graphique.md).

> `architecture.md` décrit le premier échafaudage du projet (tableaux, listes, cartes). Le code a beaucoup changé depuis : quand les deux ne disent pas la même chose, c'est le code et ce guide qui font foi.

## Vue d'ensemble

| Partie | Technologies | Dossier |
| :--- | :--- | :--- |
| API | Spring Boot 3, Java 21, Spring Security (JWT), JPA, Flyway | `backend/` |
| Base de données | PostgreSQL ; le schéma vient des migrations Flyway | `backend/src/main/resources/db/migration/` |
| Interface | React 18, TypeScript strict, Vite, Tailwind, Zustand | `frontend/` |
| Mails en développement | Mailpit, qui garde les mails au lieu de les envoyer | `docker-compose.yml` |

Mura est hébergé par ceux qui l'utilisent : tout ce qui dépend de l'instance (adresse publique, expéditeur des mails, informations légales) vient de la configuration, jamais du code.

## Backend

### Les paquets

Le code est rangé par domaine, pas par couche : chaque paquet contient ses entités, ses dépôts, son service, son contrôleur et ses DTO.

| Paquet | Contenu |
| :--- | :--- |
| `auth` | Inscription, connexion, vérification de l'adresse, mot de passe oublié, « Mon compte » (copie des données, suppression) |
| `member` | Les comptes (`User`) et le carnet : qui l'on connaît, favoris, demandes de contact |
| `project` | Projets, types de projet, membres et rôles, invitations, contrôle d'accès (`ProjectAccessGuard`) |
| `task` | Tâches, sous-tâches, historique des statuts |
| `group` | Groupes de personnes et mise en retrait |
| `notification` | La cloche : notifications enregistrées et leur formulation (`NotificationWording`) |
| `mail` | Envoi des mails et codes à usage unique (`EmailTokenService`) |
| `admin` | Administration : comptes, groupes, types de projet |
| `common` | Sécurité (filtre JWT), configuration, gestion des erreurs |

### Le chemin d'une requête

1. `JwtAuthenticationFilter` lit le jeton et recharge le compte en base à chaque requête : un compte suspendu ou supprimé perd l'accès tout de suite. Un compte dont l'adresse n'est pas vérifiée n'atteint que `/api/auth/me`, `/verify` et `/verify/resend`.
2. Le contrôleur ne fait que traduire HTTP : il lit l'utilisateur connecté (`@AuthenticationPrincipal`), valide le corps (`@Valid`) et appelle le service.
3. Le service porte toutes les règles et ouvre la transaction (`@Transactional`).
4. En cas de refus, le service lève une `ApiException(statut, message, champ)`. `GlobalExceptionHandler` la transforme en réponse `{ "message": …, "field": … }`. Le message est écrit pour la personne qui le lit, en français : l'interface l'affiche tel quel.

Les erreurs de l'appelant (identifiant mal formé, JSON illisible, adresse inconnue, mauvaise méthode) répondent 400, 404, 405 ou 415. Seule une vraie panne répond 500 et s'inscrit dans les logs.

### Règles maison

- **L'accès à un projet passe par `ProjectAccessGuard`.** Il répond toujours 404 si le projet n'existe pas, avant de répondre 403. Trois niveaux : être membre (`requireMembership`), le gérer (`requireManager`, propriétaire ou admin du projet), en être propriétaire (`requireOwner`).
- **Deux systèmes de rôles, à ne jamais mélanger.** `AccountRole` (ADMIN ou USER) dit qui administre l'instance. `ProjectRole` (OWNER, ADMIN, MEMBER) dit qui fait quoi dans un projet. Un administrateur de l'instance n'a aucun droit particulier dans un projet.
- **Les mails partent après la validation de la transaction.** `MailService` attend que la transaction qui les demande soit validée, puis les envoie sur un autre fil. Une opération annulée n'envoie donc rien, et un serveur de mail lent ne ralentit pas la réponse.
- **Une notification naît à un seul endroit**, `NotificationService.record`, qui envoie aussi son mail. Une nouvelle sorte de notification s'ajoute à `NotificationType` et à `NotificationWording`.
- **Certaines suppressions sont des instructions JPQL, exprès.** La suppression d'un compte ou d'un groupe passe par `DELETE … WHERE` plutôt que par `repository.delete(entité)` : dans certaines transactions, la suppression par entité n'envoyait aucune requête SQL, sans erreur. Ces instructions renvoient le nombre de lignes supprimées. Ne pas les « simplifier ».
- **Pas de requête par ligne.** Une liste se charge avec ce qu'elle affiche en une seule requête (`JOIN FETCH`, comptages groupés). Les dépôts le disent dans leurs commentaires.
- **L'identité ignore la casse.** Les adresses et les noms d'utilisateur sont normalisés dans les DTO de requête, et la base a des index uniques sur `lower(email)` et `lower(username)`.
- **Les DTO sont des `record`**, avec leurs règles de validation. Quand plusieurs champs sont faux, l'erreur renvoyée est celle du champ le plus haut dans le record : l'ordre des champs compte.
- **Une migration Flyway publiée ne se modifie jamais.** Un changement de schéma ajoute un nouveau fichier `V<n>__description.sql`.

## Frontend

### Les dossiers

| Dossier | Contenu |
| :--- | :--- |
| `pages/` | Une page par route. Elle assemble les composants et garde l'état propre à l'écran. |
| `components/` | Les morceaux d'interface réutilisés ou sortis d'une page trop grande |
| `hooks/` | La logique sans affichage : chargements (`useApiQuery`, `useProject`, `useNotifications`), thème, menus |
| `services/api.ts` | Le client HTTP : ajoute le jeton, déconnecte sur un 401 |
| `store/authStore.ts` | La session (jeton et compte), gardée dans le navigateur |
| `utils/` | Fonctions pures : messages d'erreur, couleurs, règles de mot de passe, dates du planning |
| `legal/legalInfo.ts` | Les informations légales de l'instance, lues dans les variables `VITE_LEGAL_*` |

### Les routes

| Adresse | Page | Accès |
| :--- | :--- | :--- |
| `/login`, `/register`, `/mot-de-passe-oublie`, `/reset-password` | Connexion et inscription | Public |
| `/mentions-legales`, `/confidentialite` | Pages légales | Public |
| `/projets` | Mes projets, invitations, corbeille | Connecté |
| `/project/:id` | Un projet : infos, planning, tâches (`?tab=`) | Membre ou invité |
| `/carnet`, `/groupe/:id` | Le carnet, un groupe | Connecté |
| `/compte` | Mon compte | Connecté |
| `/administration` | Comptes, groupes, types de projet | Administrateur |

Un compte dont l'adresse n'est pas vérifiée ne voit que l'écran de saisie du code.

### Règles maison

- **Charger avec `useApiQuery(url, valeurInitiale, messageParDéfaut)`.** Il ignore une réponse arrivée trop tard, rend le message du serveur et propose `reload`. Une adresse `null` attend : c'est ainsi qu'une requête dépend d'une autre (voir `useProject`).
- **Un échec se dit.** Une liste qui n'a pas pu se charger affiche `ErrorMessage` avec « Réessayer », jamais l'état vide (« Aucun projet ») : ce serait faux. Plusieurs échecs pour la même raison passent par `LoadErrors`, qui n'affiche le message qu'une fois. Un `catch` vide doit dire en commentaire pourquoi l'échec peut être ignoré.
- **Toute fenêtre passe par `Modal`**, avec l'`id` de son titre dans `labelledBy`. Pour faire confirmer une action, utiliser `ConfirmDialog`. Jamais de `window.confirm` ni de `window.alert`.
- **Les couleurs passent par les classes de la charte** (`bg-surface`, `text-slate-800`, `bg-brand-gradient`…), jamais par une couleur écrite en dur : c'est ce qui fait marcher les deux thèmes.
- **Un message d'erreur de formulaire** passe par `apiErrorMessage`, et `apiErrorField` dit quel champ le serveur visait.

## Tests

| Partie | Commande | Ce qui est testé |
| :--- | :--- | :--- |
| Backend | `cd backend && mvn test` | Services (JUnit 5, Mockito) et contrôleurs (MockMvc) |
| Couverture backend | `cd backend && mvn verify` | Rapport JaCoCo dans `backend/target/site/jacoco/index.html` |
| Frontend | `cd frontend && npm test` | Hooks, composants et pages (Vitest, React Testing Library) |
| Couverture frontend | `cd frontend && npm run coverage` | Rapport dans `frontend/coverage/` |

Sans Maven installé, les tests backend tournent dans l'image utilisée par le `Dockerfile` :

```bash
docker run --rm -v "$PWD/backend:/app" -v mura-m2:/root/.m2 -w /app maven:3.9-eclipse-temurin-21-alpine mvn -B test
```

Ce qui aide à écrire un test :

- **Backend** : `support/Fixtures` fabrique les entités, et `support/ControllerTestSupport` monte un contrôleur avec la gestion d'erreurs et un utilisateur connecté (`ME`). Pour un service qui contrôle l'accès à un projet, passer un vrai `ProjectAccessGuard` construit sur les dépôts simulés : le test vérifie alors le vrai contrôle.
- **Frontend** : `test/fixtures.ts` fabrique les données, `test/render.tsx` (`renderAt`) monte un écran dans un routeur. Le client HTTP est simulé par `services/__mocks__/api.ts`. Une page répond par adresse plutôt que par ordre d'appel, parce que la barre du haut et la cloche font leurs propres requêtes (voir `emptyServer` dans `pages.test.tsx`).

## Ajouter une fonctionnalité

1. Créer une branche depuis `V1`.
2. Si le schéma change, ajouter une migration `V<n>__….sql`.
3. Écrire la règle dans le service du domaine, avec ses refus en `ApiException` et ses tests.
4. Exposer la route dans le contrôleur, avec un test MockMvc pour le cas nominal et pour un refus.
5. Côté interface, charger avec `useApiQuery`, afficher les échecs, et passer les fenêtres par `Modal`.
6. Avant de committer : `mvn test`, puis `npm test`, `npm run lint` et `npm run build` dans `frontend/`.
