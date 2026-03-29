# Change: Upgrade Drizzle ORM to v1.0

## Why

Drizzle ORM has released v1.0 RC (beta channel) with significant improvements including a new relational queries API (v2), consolidated validator packages, and a new migration folder structure. Upgrading now positions the project for the stable release and provides access to `through` for many-to-many relations, object-based `where`/`orderBy` in relational queries, and simplified `defineRelations()`.

## What Changes

- Upgrade `drizzle-orm` from `^0.45.2` to `@beta` (`1.0.0-beta.x`)
- Upgrade `drizzle-kit` from `^0.31.10` to `@beta`
- **BREAKING** Remove `drizzle-zod` dependency; migrate imports from `drizzle-zod` to `drizzle-orm/zod` (11 files)
- **BREAKING** Migrate relations definitions from per-table `relations(table, ...)` to single `defineRelations(schema, ...)` call (10 files)
- **BREAKING** Update `drizzle()` instantiation to pass `relations` instead of `schema` (or no second arg currently since no relational queries are used)
- Run `drizzle-kit up` to migrate folder structure (removes `journal.json`, groups SQL + snapshots into migration folders)
- Update `drizzle.config.ts` if needed for new drizzle-kit schema

## Impact

- Affected specs: database-seeding, treatment-session, treatment-plan, payment-tracking, appointment-planning, rooms-management, organization, organization-members, therapist-daily-schedule, treatment-plan-notes, consultation-planning, consultation-smart-tags, testing-infrastructure (all specs that reference DB layer)
- Affected code:
  - `server/database/schema/*.ts` (10 files with `relations()`)
  - `server/utils/database.ts` (`drizzle()` instantiation)
  - `shared/types/*.ts` (11 files importing from `drizzle-zod`)
  - `drizzle.config.ts`
  - `package.json`
  - `server/database/migrations/` (folder restructure)
- Risk: beta release; may contain breaking changes in subsequent betas before stable
