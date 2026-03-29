## 1. Preparation

- [x] 1.1 Create a dedicated feature branch from main
- [x] 1.2 Verify all tests pass on current version (`pnpm test`, `pnpm typecheck`)

## 2. Dependency Upgrade

- [x] 2.1 Install `pnpm drizzle-orm@beta` and `pnpm -D drizzle-kit@beta` (pin to specific beta version)
- [x] 2.2 Verify `pnpm install` succeeds with no peer dependency conflicts

## 3. Migrations Folder Restructure

- [x] 3.1 Run `pnpm drizzle-kit up` to migrate folder structure (removes `journal.json`, groups SQL + snapshots)
- [x] 3.2 Verify migration folder structure is correct
- [ ] 3.3 Commit migration folder changes

## 4. Relations Migration (v1 → v2)

- [x] 4.1 Manually create v2 relations definitions (skipped `drizzle-kit pull` — wrote directly)
- [x] 4.2 Create `server/database/relations.ts` with `defineRelations(schema, (r) => ({...}))`
- [x] 4.3 Migrate all 8 per-table `relations()` definitions into the single `defineRelations()` call
- [x] 4.4 Remove `relations()` exports and `import { relations } from 'drizzle-orm'` from each schema file:
  - `server/database/schema/patient.ts`
  - `server/database/schema/treatment-plan.ts`
  - `server/database/schema/treatment-session.ts`
  - `server/database/schema/payment.ts`
  - `server/database/schema/rooms.ts`
  - `server/database/schema/document.ts`
  - `server/database/schema/availability.ts`
  - `server/database/schema/appointment.ts`
- [x] 4.5 Relations exported from `server/database/relations.ts` (not re-exported from schema/index.ts to avoid circular imports)

## 5. Validator Import Migration

- [x] 5.1 Replace `from 'drizzle-zod'` with `from 'drizzle-orm/zod'` in all 11 files:
  - `shared/types/appointment.type.ts`
  - `shared/types/patient.types.ts`
  - `shared/types/document.type.ts`
  - `shared/types/invoicing.ts`
  - `shared/types/treatment-plan.ts`
  - `shared/types/room.types.ts`
  - `shared/types/treatment-session.type.ts`
  - `shared/types/availability.types.ts`
  - `shared/types/auth.types.ts`
  - `shared/types/org.types.ts`
  - `shared/types/definitions/document.type.ts`
- [x] 5.2 Remove `drizzle-zod` from `package.json` dependencies
- [x] 5.3 Run `pnpm install` to clean up

## 6. Database Instance Update

- [x] 6.1 Update `server/utils/database.ts` `useDrizzle()` to pass `{ relations }` to `drizzle()`
- [x] 6.2 Verify `DrizzleD1Database` type inference still works for all usage sites

## 7. Validation

- [x] 7.1 Run `pnpm typecheck` — no new type errors (pre-existing errors unchanged)
- [x] 7.2 Run `pnpm test` — all 200 tests pass
- [ ] 7.3 Run `pnpm lint` — no new lint errors
- [ ] 7.4 Start `wrangler dev` and verify basic API endpoints work against local D1
- [ ] 7.5 Test database seeding script works
