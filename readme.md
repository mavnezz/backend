# Backend

Neues Backend-Projekt. Dieses Dokument hält Ziele, Anforderungen und die
geplante Architektur fest. Offene Entscheidungen sind unten in
[Offene Fragen](#offene-fragen) gesammelt.

## Ziele

- Sauber strukturiertes, langfristig wartbares Backend.
- Skalierbar: soll mit vielen parallelen Anfragen umgehen können
  (horizontal skalierbar, zustandslose Instanzen).
- Datenbank-agnostisch bleiben über ein ORM (Abstraktion über SQL),
  um bei der Wahl/dem Wechsel der Datenbank flexibel zu sein.
- Schema-Änderungen ausschließlich über **Migrations**, damit bei Updates
  und Änderungen neue Migrations nachgeschoben werden können.

## Anforderungen

| Thema           | Anforderung |
|-----------------|-------------|
| Sprache/Runtime | Node.js / TypeScript (NestJS) |
| ORM             | ORM mit DB-Flexibilität, Abstraktion über SQL |
| Migrations      | Versionierte Migrations, inkrementell nachschiebbar |
| Skalierbarkeit  | Zustandslose Instanzen, horizontal skalierbar, Queue/Worker für Hintergrundlast |
| Architektur     | **DDD + Hexagonal Architecture** (Ports & Adapters) |
| CQRS            | Trennung von Command (schreibend) und Query (lesend) |

## Architektur

**Domain-Driven Design + Hexagonal (Ports & Adapters).**

Kernidee: Die Geschäftslogik (Domain) ist framework-frei und kennt keine
Infrastruktur. Nach außen wird nur über **Ports** (Interfaces/Verträge)
kommuniziert; konkrete Implementierungen sind **Adapter** in der
Infrastruktur-Schicht. Der Einstieg von außen (HTTP/CLI) liegt in der
UI-Schicht.

```
UI  ──▶  Application  ──▶  Domain  ◀──  Infrastructure
(Adapter)  (Use-Cases)    (Kern)      (Adapter)
```

- **Domain** — reine Geschäftslogik, framework-frei. Definiert die Ports.
- **Application** — Use-Cases / Orchestrierung (CQRS: Command & Query).
- **Infrastructure** — konkrete Adapter (Repositories, Queue, Events).
- **UI** — Einstiegspunkte von außen (HTTP-Controller, CLI-Commands).

Abhängigkeiten zeigen immer **nach innen** Richtung Domain.

### Erzwungene Abhängigkeits-Regeln

Die Schicht-Regeln werden nicht nur dokumentiert, sondern **automatisiert
geprüft** (Import-Linting in CI):

- `Domain` importiert **nichts** aus `Application`, `Infrastructure`, `UI`
  und **kein** Framework (kein `@nestjs/*`). Bewusste Ausnahme: die
  TypeORM-Decorators am Model (ActiveRecord-Kompromiss).
- `Application` darf `Domain` nutzen, **nicht** `Infrastructure`/`UI`.
- `Infrastructure` und `UI` dürfen nach innen (`Application`/`Domain`).
- **Persistenz nur über Repository-Ports** — Handler/Services sprechen den
  Port an, nie die konkrete DB-Implementierung. Auch AR-Models werden hinter
  Ports gekapselt, damit die Schicht-Trennung testbar bleibt.
- Module untereinander nur über definierte öffentliche Schnittstellen, nicht
  quer in fremde Interna.

> **Durchsetzung:** **`dependency-cruiser`** — regelbasiertes Import-Linting,
> das die obigen Grenzen in CI erzwingt und Abhängigkeitsgraphen rendern kann.
> Alternativen: `eslint-plugin-boundaries`, `ts-arch`/`arch-unit-ts`,
> `@nx/enforce-module-boundaries` (bei Nx-Monorepo).

## Projekt-Layout (Repo)

Der gesamte Quelltext liegt unter `src/`. Im Repo-Root nur Projekt-/
Betriebsdateien (Docker, CI, Config).

```
backend/
├── src/                        ← gesamter Quelltext
│   ├── Modules/                ← fachliche Module (s. Modul-Struktur)
│   │   └── User/Account/
│   ├── Shared/                 ← geteilter Kern (Base-Entity, Guards, Filter, Pagination)
│   ├── config/                 ← env-Mapping, TypeORM-DataSource
│   ├── migrations/             ← TypeORM-Migrations
│   ├── app.module.ts           ← Root-Modul (bindet Module + Shared)
│   └── main.ts                 ← Bootstrap (NestFactory)
├── test/                       ← globales e2e-Setup, Test-Utilities, Fixtures/Factories
├── Dockerfile                  ← Build/Runtime-Image
├── docker-compose.yml          ← lokale Services (Postgres prod-nah, später Redis)
├── .dockerignore
├── .dependency-cruiser.js      ← erzwungene Architektur-Regeln
├── package.json / tsconfig.json
├── .eslintrc / .prettierrc
├── .env / .env.example
├── <CI>                        ← Pipeline (.github/workflows/ oder .gitlab-ci.yml)
└── README.md
```

## Modul-Struktur

Jedes fachliche Modul folgt demselben Aufbau — hier am Beispiel `User/Account`
(unter `src/Modules/`):

```
src/Modules/User/Account/
│
├── Domain/                          ← Kern: Geschäftslogik, framework-frei
│   ├── Models/                      Entities (ORM) → UserAccount.ts
│   ├── DTOs/                        Datentransfer-Objekte → UserAccountDTO.ts
│   ├── Enums/                       Domänen-Enums → UserAccountStatus.ts
│   ├── Exceptions/                  fachliche Exceptions → UserAccountNotFoundException.ts
│   ├── Ports/                       Interfaces (Verträge) → UserAccountRepository.ts, PasswordHasher.ts
│   └── Service/                     reine Domänen-Services → UserAccountPolicy.ts
│
├── Application/                     ← Use-Cases / Orchestrierung (CQRS)
│   ├── Command/                     schreibend → RegisterUserAccountCommand(+Handler).ts
│   ├── Query/                       lesend → GetUserAccountQuery(+Handler).ts
│   ├── Service/                     Application-Services → UserAccountService.ts
│   └── Event/                       Domain-Events → UserAccountRegistered.ts
│
├── Infrastructure/                  ← Adapter: konkrete Implementierungen der Ports
│   ├── Database/                    Repository-Adapter (TypeORM) → TypeOrmUserAccountRepository.ts
│   ├── Security/                    Port-Adapter → BcryptPasswordHasher.ts
│   ├── Jobs/                        Queue-Jobs → SendWelcomeEmailJob.ts
│   └── Events/                      Event-Adapter / Listener
│
├── UI/                              ← Einstieg von außen (HTTP/CLI)
│   ├── Api/
│   │   ├── UserAccountController.ts   Controller (nur HTTP-Belange)
│   │   ├── Requests/                  Request-DTOs + Validierung → RegisterUserAccountRequest.ts
│   │   └── Transformers/              Response-Formatierung → UserAccountResponse.ts
│   ├── Console/                       CLI-Commands (Seeder-Script) → CreateAdminUser.ts
│   └── Jobs/                          UI-nahe Jobs + Listeners
│
├── Tests/                            ← Modul-Tests (Unit + Feature)
│   ├── Unit/                         isolierte Logik, Ports gemockt → RegisterUserAccountHandler.spec.ts
│   └── Feature/                      Use-Case über HTTP + Test-DB → RegisterUserAccount.feature.spec.ts
│
├── AccountPermissions.ts             ← Permission-Konstanten des Moduls
└── UserAccountModule.ts              ← @Module: Bindings (Port→Adapter), Routen, CQRS-Handler
```

> **Entscheidung:** ORM-Model = Domain-Model, direkt in `Domain/Models`
> (ActiveRecord-Stil, pragmatisch). Bewusster Kompromiss: die Domain kennt
> damit das ORM. Dafür deutlich weniger Boilerplate als bei strikter Trennung
> Domain-Entity ↔ Persistence-Model. Das ORM muss daher ActiveRecord
> unterstützen.

## Tech-Stack

| Baustein        | Wahl | Status |
|-----------------|------|--------|
| Runtime/Sprache | Node.js / TypeScript | **entschieden** |
| Framework       | **NestJS** | **entschieden** |
| CQRS            | `@nestjs/cqrs` (CommandBus/QueryBus/EventBus) | **entschieden** |
| DI / Module     | NestJS DI-Container + Module (= "ServiceProvider") | **entschieden** |
| ORM             | **TypeORM** im ActiveRecord-Mode (Model = Domain-Model) | **entschieden** |
| Migrations      | TypeORM Migrations (inkrementell nachschiebbar) | **entschieden** |
| Auth            | JWT (stateless) + Roles/Permissions-Guards | **entschieden** |
| Validierung     | `class-validator` + `ValidationPipe` (DTOs) | **entschieden** |
| API-Doku        | `@nestjs/swagger` (aus Code generiert), UI unter `/docs` | **entschieden** |
| Architektur-Check | `dependency-cruiser` (Schicht-/Modul-Grenzen, CI) | **entschieden** |
| Tests           | Jest (Unit + Feature) + `supertest` (HTTP) | **entschieden** |
| Coverage         | CI-Coverage mit Threshold; **kein Feature ohne Tests** | **entschieden** |
| DB (Dev)        | **SQLite** (Zero-Config, lokal) | **entschieden** |
| DB (Prod)       | **PostgreSQL** (per env; ORM-abstrahiert) | **entschieden** |
| Deployment      | Docker → Docker Swarm → ggf. K8s | **entschieden** (Weg) |
| Queue/Worker    | BullMQ (Redis) — später bei Bedarf (eingeplant) | später |

### NestJS-Bausteine je Modul

| Baustein            | Umsetzung |
|---------------------|-----------|
| Modul-Registrierung | `@Module` (Provider/Bindings/Imports) |
| CQRS-Bus            | `@nestjs/cqrs` `CommandBus`/`QueryBus`/`EventBus` |
| Port               | TS-Interface + DI-Token (`@Inject`) |
| Adapter            | Provider, an Port-Token gebunden |
| Entity             | TypeORM-Entity (ActiveRecord, `extends BaseEntity`) |
| Request-Validierung | DTO + `class-validator` (`ValidationPipe`) |
| Response           | Response-DTO / Serializer |
| CLI-Command        | Standalone-Script (`NestFactory.createApplicationContext`) |
| Permissions        | RBAC + `PermissionsGuard` + `@RequirePermission` |

## Auth & Permissions

- **Stateless via JWT** — kein Server-Session-State → horizontal skalierbar.
  Das Token trägt Identität, Rollen und die aufgelösten Permissions
  (Momentaufnahme zum Login-Zeitpunkt).
- **RBAC, DB-gestützt:** Tabellen `permissions` (Registry) und `roles`
  (Rolle → Permission-Namen). Ein User hat **mehrere Rollen** möglich
  (`UserAccount.roles: string[]`); der Resolver vereinigt deren Permissions.
- **Routen-Schutz:** jede geschützte Route verlangt eine konkrete Permission
  über `@RequirePermission('...')`. `@Public()` markiert offene Routen (Login,
  Registrierung). Guards: `JwtAuthGuard` (authentifiziert, secure-by-default) +
  `PermissionsGuard` (autorisiert).
- **Initialer Admin:** wird **beim Boot automatisch angelegt**, gesteuert über
  `ADMIN_EMAIL` / `ADMIN_PASSWORD` (idempotent; ohne die Variablen passiert
  nichts). Alternativ manuell via CLI: `npm run seed:admin -- <email> <password>`.

### Permissions werden aus dem Code entdeckt (kein manueller Seeder)

Permissions werden **ausschließlich an den Routen deklariert** und beim Boot
automatisch übernommen:

1. **Discovery:** `PermissionDiscoveryService` scannt via NestJS
   `DiscoveryService` alle Controller-Routen und sammelt die
   `@RequirePermission(...)`-Metadaten ein — das ist die einzige Quelle.
2. **Boot-Seeder:** `PermissionSynchronizer` (`OnApplicationBootstrap`)
   schreibt **fehlende** Permissions in die `permissions`-Tabelle nach
   (idempotent, sicher bei jedem Deploy/Boot).
3. **Admin automatisch:** die `admin`-Rolle bekommt **alle** Permissions
   zugeordnet. Neues Modul → neue Route-Permissions → beim Boot automatisch in
   der Tabelle **und** bei Admin.
4. **Login:** `PermissionResolver` (Port) löst die Rollen des Users in
   Permissions auf; diese landen im JWT.

Der Mechanismus liegt in `Shared/Authorization` (Querschnitt, den jedes Modul
über die Guards nutzt). Login/Guards hängen nur am **Port `PermissionResolver`**,
nicht an der konkreten DB-Implementierung — s. [Ausblick](#ausblick).

## API-Konventionen

- **REST**, versioniert unter `/api/v1`.
- **Validierung** eingehender Requests via DTO + `class-validator`
  (globale `ValidationPipe`, `whitelist: true`).
- **Einheitliches Fehler-Format** über einen globalen Exception-Filter
  (z. B. `{ error: { code, message, details } }`); fachliche Domain-Exceptions
  werden dort auf HTTP-Status gemappt.
- **Responses** über explizite Response-DTOs / Serializer — keine ORM-Models
  direkt ausliefern.
- **API-Doku** via `@nestjs/swagger` — **aus dem Code generiert** (Swagger-CLI-
  Plugin liest Typen + `class-validator`-Decorators), interaktive UI unter
  `/docs`, OpenAPI-JSON unter `/docs-json`. Bearer-Auth-Button integriert.

## Shared-Module

Querschnitts-Code lebt unter `src/Shared/` (nicht in Fachmodulen dupliziert):

- `Shared/Domain/` — `DomainException` (Basis für fachliche Exceptions).
- `Shared/Http/Filters/` — `GlobalExceptionFilter` (einheitliches Fehler-Format).
- `Shared/Auth/` — JWT-Authentifizierung: `JwtStrategy`, `JwtAuthGuard`,
  `PermissionsGuard`, Decorators (`@Public`, `@RequirePermission`, `@CurrentUser`).
- `Shared/Authorization/` — Autorisierung: Permission-Discovery, Boot-Seeder,
  DB-Resolver, `Role`/`Permission`-Entities (s. [Auth & Permissions](#auth--permissions)).

`SharedModule` ist `@Global` und stellt Validierung (`ValidationPipe`),
Fehler-Filter und die Auth/Authorization-Provider modulweit bereit.

## Tests & Coverage

> **Regel: Kein Feature ohne Tests.** Jede fachliche Änderung liefert ihre
> Tests mit (Unit + Feature, wo HTTP-relevant). PRs ohne Tests werden nicht
> gemerged — Teil der Definition of Done, in CI erzwungen.

- **Framework:** Jest (NestJS-Standard) + `supertest` für HTTP-Feature-Tests.
- **Zwei Arten:**
  - **Unit** — isolierte Domain-/Application-Logik; Ports gemockt, keine
    DB/HTTP → schnell.
  - **Feature** — Use-Case end-to-end über HTTP (bzw. CommandBus) gegen die
    gebootete Nest-App mit Test-DB (SQLite in-memory).
- **Struktur:** jedes Modul bringt seine Tests selbst mit (`Tests/Unit`,
  `Tests/Feature`), gespiegelt zur Schicht-Struktur — so ist jedes Modul für
  sich testbar. Globales e2e-Setup, Utilities und Fixtures/Factories in `test/`.
- **Coverage:** Jest-Coverage läuft in CI mit Schwellenwerten (z. B.
  Domain/Application ≥ 90 %, global ≥ 80 %); der Build bricht unter dem
  Threshold.

## Entschieden

- **Framework:** NestJS (Node.js / TypeScript).
- **ORM:** TypeORM im ActiveRecord-Mode; Model = Domain-Model in `Domain/Models`.
- **Persistenz:** ausschließlich über Repository-Ports (Adapter in Infrastructure).
- **Migrations:** TypeORM Migrations, inkrementell nachschiebbar.
- **CQRS/DI:** `@nestjs/cqrs` + NestJS-Module als "ServiceProvider".
- **Modul-Struktur:** wie oben (Domain / Application / Infrastructure / UI
  je Modul).
- **Repo-Layout:** Quelltext unter `src/`; Projekt-/Betriebsdateien
  (Dockerfile, docker-compose, CI) im Root.
- **Tests:** Jest — Unit + Feature je Modul (`Tests/`), Coverage-Threshold in
  CI. **Kein Feature ohne Tests** (Definition of Done).
- **Architektur-Check:** `dependency-cruiser` erzwingt Schicht-/Modul-Grenzen in CI.
- **Auth:** JWT (stateless), DB-gestütztes RBAC mit Rollen + Permissions;
  Permissions werden aus den Route-Metadaten **automatisch entdeckt** und beim
  Boot geseedet, Admin bekommt alle. Public- vs. Permission-Guard-Routen.
- **IDs:** UUID v4 (GUID), app-seitig via `crypto.randomUUID()` erzeugt,
  gespeichert als `varchar(36)` — portabel über SQLite/Postgres.
- **API:** REST unter `/api/v1`, `class-validator`, einheitliches Fehler-Format,
  Response-DTOs.
- **Dev-Datenbank:** SQLite (Zero-Config) für lokale Entwicklung + Migrations.
- **Prod-Datenbank:** PostgreSQL (per env, ORM-abstrahiert).
- **Deployment:** Docker → Docker Swarm → ggf. K8s.
- **Queue/Worker:** BullMQ (Redis) bewusst **später** — kommt bei Bedarf
  (Background-Jobs, async Events). Architektur ist darauf vorbereitet
  (`Infrastructure/Jobs`).
- **Referenz-Modul:** `User`/`Account` als lauffähige Blaupause.

## Status

Das Grundgerüst steht und ist verifiziert (Build, `dependency-cruiser`, Lint,
19 Tests inkl. Coverage-Threshold, Migrations-CLI):

- Referenz-Modul **User/Account** (Domain/Application/Infrastructure/UI) mit
  Registrierung, Login (JWT) und geschütztem Lesezugriff.
- Auto-Permission-System (Discovery + Boot-Seeder + DB-Resolver) und
  **automatischer Admin-Seed beim Boot** (per env).
- **Swagger/OpenAPI** aus dem Code generiert, UI unter `/docs`.
- TypeORM mit SQLite-Dev / Postgres-Prod, zwei Migrations, `@nestjs/cqrs`,
  globale Validierung + Fehler-Filter, `dependency-cruiser`, Docker, CI.

## Setup & Commands

```bash
npm install
cp .env.example .env          # ADMIN_EMAIL/ADMIN_PASSWORD → Auto-Admin beim Boot
npm run migration:run         # Schema anlegen (Dev: dev.sqlite)
npm run start:dev             # API: http://localhost:3000/api/v1  ·  Docs: /docs

npm test                      # Unit + Feature
npm run test:cov              # mit Coverage-Threshold
npm run lint
npm run depcruise             # Architektur-Regeln
npm run build
npm run seed:admin -- <email> <password>   # optional: Admin manuell anlegen
```

**API-Doku:** interaktive Swagger-UI unter `http://localhost:3000/docs`
(OpenAPI-JSON: `/docs-json`).

Ausgewählte Endpunkte: `POST /api/v1/accounts` (public, Registrierung),
`POST /api/v1/auth/login` (public), `GET /api/v1/auth/me` (auth),
`GET /api/v1/accounts/:id` (Permission `user-account:read`).

## Ausblick

- **Rollen/Permissions als eigenes Modul** (z. B. `Modules/Access`): Rollen
  anlegen/ändern/löschen, Permissions Rollen zuweisen, Rollen an User. Der Umbau
  ist sauber, weil Login/Guards nur am Port `PermissionResolver` hängen — das
  Access-Modul liefert dann Implementierung + CRUD und übernimmt die
  `Role`/`Permission`-Entities; `Shared` behält nur den Vertrag.
- **Queue/Worker** (BullMQ) bei Bedarf — Andockpunkt `Infrastructure/Jobs`.
- **Native `uuid`-Spalte auf Postgres** (statt `varchar(36)`) — optional,
  treiberabhängig, falls gewünscht.
