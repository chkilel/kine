# data-layer Specification

## Purpose
TBD - created by archiving change upgrade-drizzle-orm-v1. Update Purpose after archive.
## Requirements
### Requirement: Database Schema Relations

The database layer SHALL define all table relations using Drizzle ORM v2 `defineRelations()` in a single consolidated relations file, replacing per-table `relations()` calls.

#### Scenario: Relations consolidated in single file

- **WHEN** the application bootstraps the Drizzle database instance
- **THEN** all table relations SHALL be defined in `server/database/relations.ts` using `defineRelations(schema, (r) => ({...}))`

#### Scenario: Schema files contain no relation definitions

- **WHEN** a developer inspects any file under `server/database/schema/`
- **THEN** the file SHALL contain only table definitions (sqliteTable) and SHALL NOT contain `relations()` calls

### Requirement: Drizzle Validator Imports

All Zod schema generation SHALL use `drizzle-orm/zod` instead of the separate `drizzle-zod` package.

#### Scenario: Type files import from drizzle-orm/zod

- **WHEN** a shared type file generates Zod schemas from Drizzle tables
- **THEN** it SHALL import `createInsertSchema`, `createSelectSchema`, or `createUpdateSchema` from `drizzle-orm/zod`

#### Scenario: drizzle-zod package removed

- **WHEN** `package.json` dependencies are inspected
- **THEN** `drizzle-zod` SHALL NOT appear as a dependency

