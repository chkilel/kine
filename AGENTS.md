# Kine - Plateforme de Kinesitherapie

## Project Overview

Kine is a full-stack physiotherapy practice management platform built for French-speaking kinésithérapeutes. It manages patients, appointments, treatment plans/sessions, documents, invoicing, and organization/therapist administration.

## Tech Stack

- **Framework:** Nuxt 4 (Vue 3, TypeScript)
- **UI:** Nuxt UI v4 + Tailwind CSS v4
- **State:** Pinia + Pinia Colada (data fetching)
- **Auth:** Better Auth
- **Database:** Cloudflare D1 (SQLite) via Drizzle ORM
- **Storage:** Cloudflare R2 (S3-compatible)
- **Deployment:** Cloudflare Workers (Nitro preset: `cloudflare_module`)
- **Package Manager:** pnpm
- **Testing:** Vitest
- **Linting:** Oxlint
- **Formatting:** Prettier with Tailwind plugin

## Commands

| Command | Description |
|---|---|
| `pnpm dev` | Start dev server |
| `pnpm build` | Production build |
| `pnpm preview` | Build + wrangler dev |
| `pnpm deploy` | Build + deploy to Cloudflare |
| `pnpm lint` | Run oxlint linter |
| `pnpm lint:fix` | Auto-fix linting issues |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm db:gen` | Generate Drizzle migrations |
| `pnpm db:mig` | Apply D1 migrations (local) |
| `pnpm db:mig-remote` | Apply D1 migrations (remote) |
| `pnpm db:seed` | Seed the local database |
| `pnpm cf-typegen` | Generate Cloudflare types |

## Project Structure

```
app/                    # Frontend (Nuxt auto-imported)
  assets/css/main.css   # Global styles, Tailwind theme, custom colors
  components/           # Vue components organized by domain
  composables/          # Vue composables (useAuth, usePatient, useAppointment, etc.)
  layouts/              # Nuxt layouts (default.vue)
  middleware/           # Global middleware (auth.global.ts)
  pages/                # File-based routing
    (auth)/             # Auth pages (login, register)
    patients/           # Patient management
    therapists/         # Therapist management
    organizations/      # Organization management
    invoices/           # Invoicing pages
    settings/           # Settings pages
    onboarding/         # Onboarding flow
  plugins/              # Nuxt plugins
  types/                # Frontend-only types
  utils/                # Frontend-only utilities

server/                 # Backend (Nitro)
  api/                  # API routes organized by domain
    auth/               # Better Auth handlers
    appointments/       # Appointment CRUD
    patients/           # Patient CRUD
    therapists/         # Therapist CRUD
    organizations/      # Organization CRUD
    payments/           # Payment/invoicing CRUD
    treatment-plans/    # Treatment plan CRUD
    treatment-sessions/ # Treatment session CRUD
    availability/       # Availability templates & exceptions
    rooms/              # Room management
    r2/                 # R2 file upload/download
    db/                 # Database seed endpoint
  database/
    schema/             # Drizzle schema definitions (one file per domain)
    relations.ts        # Drizzle relational queries
    migrations/         # SQL migration files (flat, auto-generated)
  utils/                # Server utilities
    auth.ts             # Better Auth server config
    database.ts         # useDrizzle(), useDB(), useNitroDatabase()
    error.ts            # handleApiError() - centralized error handling
    response.ts         # successResponse(), listResponse(), deletedResponse()
    r2.ts               # R2 storage helpers
    pricing.ts          # Pricing calculation logic
    treatment-session-validation.ts

shared/                 # Shared between client & server
  types/                # Shared TypeScript types (one file per domain)
  utils/                # Shared utilities (date, time, constants, etc.)
```

## Code Conventions

### Formatting (Prettier)
- 2 spaces, no tabs
- No semicolons
- Single quotes
- No trailing commas
- Print width: 120
- Vue indent script and style: true

### Linting (Oxlint)
- Always run `pnpm lint` before committing changes
- Use `pnpm lint:fix` to auto-fix issues where possible
- Configured with TypeScript and Vue plugins for Nuxt 4
- Categories enabled: `correctness` (error), `suspicious` (warn)

### Language
- The UI is in **French**. All user-facing strings, error messages, and comments should be in French.
- Code identifiers (variables, functions, types) use English.

### UI / Styling
- Use **Nuxt UI v4** components exclusively. Check `app.config.ts` for configured icons (hugeicons) and default variants.
- Default input/select/textarea variant is `subtle`.
- Primary color: `blue`, neutral: `zinc`.
- Custom green palette defined in `main.css`.
- Fonts: `Geist` (body/sans), `Manrope` (headings/title).
- Icons: Use **Hugeicons** via `@iconify-json/hugeicons`. Do NOT use Lucide icons for new code.

### Database
- Schema: **Drizzle ORM** with SQLite dialect for Cloudflare D1.
- Schema files live in `server/database/schema/`, one file per domain entity.
- Relations defined in `server/database/relations.ts` using Drizzle relational queries.
- All DB access goes through `useDrizzle(event)` from `server/utils/database.ts`.
- Column helpers in `server/database/schema/columns.helpers.ts` for common patterns (timestamps, UUIDs, etc.).

### API Routes
- Use `defineEventHandler` from Nitro.
- Return structured responses: `successResponse()`, `listResponse()`, `deletedResponse()` from `server/utils/response.ts`.
- Handle errors with `handleApiError()` from `server/utils/error.ts`.
- Validate input with Zod.

### Authentication
- Better Auth with Drizzle adapter for D1.
- Server config: `server/utils/auth.ts`
- Client composable: `app/composables/useAuth.ts`
- Global auth middleware: `app/middleware/auth.global.ts`

### State & Data Fetching
- Pinia for client state management.
- Pinia Colada for server state / data fetching with caching.
- Composables follow the pattern: `use[Domain].ts` (e.g., `usePatient.ts`, `useAppointment.ts`).

### Shared Code
- Types shared between client and server go in `shared/types/`.
- Utility functions shared between client and server go in `shared/utils/`.
- Domain constants go in `shared/utils/constants.*.ts`.

### File Storage
- Cloudflare R2 via S3-compatible API (`@aws-sdk/client-s3`).
- Upload/download helpers in `server/utils/r2.ts` and `server/api/r2/`.

## Important Notes

- Always run `pnpm lint` and `pnpm typecheck` after making code changes to verify correctness.
- Always run `pnpm test` to check for regressions.
- Do NOT commit `.env` files. Use `.env.example` as reference.
- The project uses Nuxt 4 compatibility date `2025-07-15`.
- Cloudflare bindings (D1 as `DB`) are accessed via Nitro's experimental database layer.
- Migrations are flattened via `scripts/flatten-migrations.js` after generation.
