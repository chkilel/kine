## Context

Drizzle ORM v1.0 is in RC (beta channel). The project currently uses `drizzle-orm@0.45.2`, `drizzle-kit@0.31.10`, and `drizzle-zod@0.8.3`. The project uses Cloudflare D1 (SQLite dialect) and has v1-style relations defined per-table across 10 schema files. No relational queries (`db.query.*`) are currently used — all queries use standard `db.select().from()` patterns. The `drizzle()` instance does not pass `schema`.

## Goals / Non-Goals

- Goals:
  - Upgrade to Drizzle ORM v1.0 beta to prepare for stable release
  - Migrate relations to `defineRelations()` v2 API
  - Consolidate `drizzle-zod` into `drizzle-orm/zod`
  - Restructure migration folder via `drizzle-kit up`
- Non-Goals:
  - Migrating existing standard queries to relational queries v2 (no `db.query.*` exists today)
  - Leveraging new v2 features like `through`, predefined filters, or object-based `where`/`orderBy` (adopt incrementally later)
  - Updating to stable v1.0 before it is released

## Decisions

- **Decision**: Upgrade to `@beta` tag rather than waiting for stable. Rationale: The project has no relational queries in production, making the relations migration low-risk. Early adoption surfaces issues before stable release.
- **Decision**: Use `drizzle-kit pull` to auto-generate v2 relations definitions, then manually verify and adjust. Rationale: Faster than manual migration for 10 tables.
- **Decision**: Remove `drizzle-zod` package entirely and import from `drizzle-orm/zod`. Rationale: Per official docs, `drizzle-zod` is no longer maintained separately.
- **Decision**: Create a single `server/database/relations.ts` file using `defineRelations()` consolidating all relations from individual schema files. Rationale: Cleaner separation of schema tables from their relationships, matches v2 guidance.

## Risks / Trade-offs

- **Beta instability** → Pin to a specific `1.0.0-beta.x` version; do not use floating `@beta` in production until stable ships
- **Type inference changes** → The `DrizzleD1Database` type gains a `TRelations` generic param; verify all type annotations compile
- **Migration folder restructure** → `drizzle-kit up` is one-way; commit before running; test against local D1

## Migration Plan

1. Create a dedicated branch from main
2. Pin and install `drizzle-orm@beta` + `drizzle-kit@beta`
3. Run `drizzle-kit up` on migrations folder
4. Run `drizzle-kit pull` to generate v2 relations skeleton
5. Consolidate into `server/database/relations.ts`
6. Replace `from 'drizzle-zod'` with `from 'drizzle-orm/zod'` across 11 files
7. Remove `drizzle-zod` from `package.json`
8. Update `useDrizzle()` to pass `relations` if needed
9. Run `pnpm typecheck` and `pnpm test`
10. Verify with `wrangler dev` against local D1

## Open Questions

- Should we adopt relational queries v2 for any existing standard queries during this upgrade, or defer to a follow-up?
- Is `drizzle-kit up` safe to run on the current migration folder, or should we start fresh?
