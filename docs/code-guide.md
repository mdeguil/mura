# Mura code guide

**English** | [Français](code-guide.fr.md)

This guide explains how the code is laid out and the few house rules it follows, so that you can add a feature without reading everything. To install and run the application, see [setup.md](setup.md). For colours and visual components, see [design-guide.md](design-guide.md).

> `architecture.md` describes the project's first scaffold (boards, lists, cards). The code has changed a lot since: when the two disagree, the code and this guide are what counts.

## Overview

| Part | Technologies | Folder |
| :--- | :--- | :--- |
| API | Spring Boot 3, Java 21, Spring Security (JWT), JPA, Flyway | `backend/` |
| Database | PostgreSQL; the schema comes from the Flyway migrations | `backend/src/main/resources/db/migration/` |
| Interface | React 18, strict TypeScript, Vite, Tailwind, Zustand, i18next | `frontend/` |
| Mail in development | Mailpit, which keeps mails instead of sending them | `docker-compose.yml` |

Mura is hosted by the people who use it: everything that depends on the instance (public address, mail sender, legal information) comes from the configuration, never from the code.

## Backend

### The packages

The code is organised by domain, not by layer: each package holds its entities, repositories, service, controller and DTOs.

| Package | Contents |
| :--- | :--- |
| `auth` | Sign-up, sign-in, address verification, forgotten password, "My account" (copy of the data, deletion), the account's language |
| `member` | Accounts (`User`) and the carnet: who you know, favourites, contact requests |
| `project` | Projects, project types, members and roles, invitations, access control (`ProjectAccessGuard`) |
| `task` | Tasks, subtasks, status history |
| `group` | Groups of people and putting a member on hold |
| `notification` | The bell: recorded notifications and their wording (`NotificationWording`) |
| `mail` | Sending mail and one-time codes (`EmailTokenService`) |
| `admin` | Administration: accounts, groups, project types |
| `common` | Security (JWT filter), configuration, error handling, texts in French and English (`i18n/Texts`) |

### The path of a request

1. `JwtAuthenticationFilter` reads the token and reloads the account from the database on every request: a suspended or deleted account loses access at once. An account whose address is not verified only reaches `/api/auth/me`, `/verify`, `/verify/resend` and `/api/auth/me/language`.
2. The controller only translates HTTP: it reads the signed-in user (`@AuthenticationPrincipal`), validates the body (`@Valid`) and calls the service.
3. The service holds all the rules and opens the transaction (`@Transactional`).
4. On a refusal, the service throws an `ApiException(status, key, field)`. `GlobalExceptionHandler` turns it into a `{ "message": …, "field": … }` response. The message is written for the person who reads it, in the language of the request (the `Accept-Language` header, French by default): the interface shows it as it is.

Errors from the caller (a malformed identifier, unreadable JSON, an unknown address, the wrong method) answer 400, 404, 405 or 415. Only a real failure answers 500 and goes in the logs.

### House rules

- **Access to a project goes through `ProjectAccessGuard`.** It always answers 404 if the project does not exist, before answering 403. Three levels: being a member (`requireMembership`), managing it (`requireManager`, project owner or admin), owning it (`requireOwner`).
- **Two role systems, never to be mixed.** `AccountRole` (ADMIN or USER) says who administers the instance. `ProjectRole` (OWNER, ADMIN, MEMBER) says who does what in a project. An instance administrator has no special right in a project.
- **Mails leave after the transaction is committed.** `MailService` waits for the transaction that asks for them to be committed, then sends them on another thread. A rolled-back operation therefore sends nothing, and a slow mail server does not slow the response down.
- **A notification is born in one place**, `NotificationService.record`, which also sends its mail. A new kind of notification is added to `NotificationType` and to `NotificationWording`.
- **Every text a person reads is a key, not a sentence.** Errors, validation messages, mails and notifications are keys of `messages.properties` (French) and `messages_en.properties` (English), read through `Texts`. Both files must have the same keys: `TextsTest` checks it. A mail or a notification is written in the recipient's language (`User.getLocale()`), not in that of whoever triggered it. The account's language is set at sign-up, refreshed at sign-in and changed with `PUT /api/auth/me/language`.
- **Some deletions are JPQL statements, on purpose.** Deleting an account or a group goes through `DELETE … WHERE` rather than `repository.delete(entity)`: in some transactions, deleting by entity sent no SQL at all, without an error. These statements return the number of rows deleted. Do not "simplify" them.
- **No query per row.** A list is loaded with what it displays in a single query (`JOIN FETCH`, grouped counts). The repositories say so in their documentation.
- **Identity ignores case.** Addresses and usernames are normalised in the request DTOs, and the database has unique indexes on `lower(email)` and `lower(username)`.
- **DTOs are `record`s**, with their validation rules. When several fields are wrong, the error returned is that of the topmost field in the record: the order of the fields matters.
- **A published Flyway migration is never edited.** A schema change adds a new `V<n>__description.sql` file.

## Frontend

### The folders

| Folder | Contents |
| :--- | :--- |
| `pages/` | One page per route. It assembles components and keeps the state specific to the screen. |
| `components/` | The pieces of interface that are reused or taken out of a page that grew too big |
| `hooks/` | Logic without display: loading (`useApiQuery`, `useProject`, `useNotifications`), theme, menus |
| `i18n/` | The texts of the interface in French and English, by area (`messages/`), and the choice of language |
| `services/api.ts` | The HTTP client: adds the token and the `Accept-Language` header, signs out on a 401 |
| `store/authStore.ts` | The session (token and account), kept in the browser |
| `utils/` | Pure functions: error messages, colours, password rules, planning dates |
| `legal/legalInfo.ts` | The instance's legal information, read from the `VITE_LEGAL_*` variables |

### The routes

| Address | Page | Access |
| :--- | :--- | :--- |
| `/login`, `/register`, `/mot-de-passe-oublie`, `/reset-password` | Sign-in and sign-up | Public |
| `/mentions-legales`, `/confidentialite` | Legal pages | Public |
| `/projets` | My projects, invitations, bin | Signed in |
| `/project/:id` | A project: info, planning, tasks (`?tab=`) | Member or invitee |
| `/carnet`, `/groupe/:id` | The carnet, a group | Signed in |
| `/compte` | My account | Signed in |
| `/administration` | Accounts, groups, project types | Administrator |

An account whose address is not verified only sees the screen where the code is entered.

### House rules

- **Load with `useApiQuery(url, initialValue, defaultMessage)`.** It ignores a response that arrives too late, returns the server's message and offers `reload`. A `null` address waits: this is how one request depends on another (see `useProject`).
- **A failure is stated.** A list that could not be loaded shows `ErrorMessage` with "Try again", never the empty state ("No project"): that would be false. Several failures for the same reason go through `LoadErrors`, which shows the message only once. An empty `catch` must say, in the documentation of its function, why the failure can be ignored.
- **Every window goes through `Modal`**, with the `id` of its title in `labelledBy`. To have an action confirmed, use `ConfirmDialog`. Never `window.confirm` or `window.alert`.
- **Colours go through the classes of the design guide** (`bg-surface`, `text-slate-800`, `bg-brand-gradient`…), never through a hard-coded colour: this is what makes both themes work.
- **A form's error message** goes through `apiErrorMessage`, and `apiErrorField` says which field the server aimed at.
- **Every text goes through `t()`** (react-i18next), never written in the component. The French and English messages sit side by side in `i18n/messages/`, one file per area, and `i18n/i18n.test.tsx` fails if a text exists in one language only. Dates go through `dateLocale()`, and plurals through `count` with `_one` / `_other`. A text with a link or bold goes through `Trans`.

## Tests

| Part | Command | What is tested |
| :--- | :--- | :--- |
| Backend | `cd backend && mvn test` | Services (JUnit 5, Mockito) and controllers (MockMvc) |
| Backend coverage | `cd backend && mvn verify` | JaCoCo report in `backend/target/site/jacoco/index.html` |
| Frontend | `cd frontend && npm test` | Hooks, components and pages (Vitest, React Testing Library) |
| Frontend coverage | `cd frontend && npm run coverage` | Report in `frontend/coverage/` |

Without Maven installed, the backend tests run in the image used by the `Dockerfile`:

```bash
docker run --rm -v "$PWD/backend:/app" -v mura-m2:/root/.m2 -w /app maven:3.9-eclipse-temurin-21-alpine mvn -B test
```

What helps when writing a test:

- **Backend**: `support/Fixtures` builds the entities, and `support/ControllerTestSupport` mounts a controller with the error handling, the language resolution and a signed-in user (`ME`). For a service that controls access to a project, pass a real `ProjectAccessGuard` built on the mocked repositories: the test then checks the real control.
- **Frontend**: `test/fixtures.ts` builds the data, `test/render.tsx` (`renderAt`) mounts a screen in a router. The HTTP client is mocked by `services/__mocks__/api.ts`. The tests run in French (`test/setup.ts`). A page answers by address rather than by call order, because the top bar and the bell make their own requests (see `emptyServer` in `pages.test.tsx`).

## Adding a feature

1. Create a branch from `V1`.
2. If the schema changes, add a `V<n>__….sql` migration.
3. Write the rule in the domain's service, with its refusals as `ApiException`s and its tests.
4. Expose the route in the controller, with a MockMvc test for the normal case and for a refusal.
5. Add every new text to `messages.properties` and `messages_en.properties` (backend) and to `i18n/messages/` in French and English (frontend).
6. On the interface side, load with `useApiQuery`, show failures, and put windows through `Modal`.
7. Before committing: `mvn test`, then `npm test`, `npm run lint` and `npm run build` in `frontend/`.
