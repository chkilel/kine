## Context

The `appointments` table currently includes a nullable `tags` text column (line 70 of `server/database/schema/appointment.ts`) that stores a JSON-encoded array of strings representing "smart tags" (e.g. "Douleur Diminuée", "Gain Amplitude"). The full stack was scaffolded:

- **Schema**: `tags: text()` column on `appointments`
- **API**: `PATCH /api/appointments/[id]/tags` endpoint (`server/api/appointments/[id]/tags.patch.ts`)
- **Types**: `updateTagsActionSchema` and `UpdateTagsAction` (`shared/types/appointment.type.ts`)
- **Composable**: `useUpdateAppointmentTags` (`app/composables/useAppointment.ts`) - exported but **never consumed** by any Vue component
- **Specs**: dedicated `consultation-smart-tags` capability plus a tags requirement inside `unified-appointment-session`

The frontend UI for tags was never wired up (no component imports `useUpdateAppointmentTags`). The field is dead weight.

## Goals / Non-Goals

**Goals:**
- Remove the `tags` column, API endpoint, types, composable, and specs completely
- Generate a Drizzle migration to drop the column from the D1 database
- Keep all other appointment functionality intact

**Non-Goals:**
- Replacing tags with an alternative categorization/labeling system
- Data migration/preservation of existing tag values (the field is unused in the UI, so no data loss matters in practice)
- Refactoring the cancel-appointment handler beyond removing the `tags: null` line

## Decisions

### Decision 1: Remove the column from the schema directly (no migration)

**Choice:** Delete the `tags` line from the Drizzle schema file. No migration is generated since the project is in dev phase.

**Rationale:** During development, migrations are flattened/regenerated as needed. Generating a drop-column migration for dead code adds noise. The schema file is the source of truth.

**Alternative considered:** Generate a Drizzle migration to drop the column. Rejected - unnecessary in dev and the field is unused.

### Decision 2: Delete the tags API endpoint file entirely

**Choice:** Remove `server/api/appointments/[id]/tags.patch.ts` completely rather than returning a 410 Gone stub.

**Rationale:** This is an internal API consumed only by the now-removed composable. There are no external consumers to deprecate gracefully.

### Decision 3: Remove the `consultation-smart-tags` capability spec entirely

**Choice:** Mark all five requirements in the `consultation-smart-tags` spec as REMOVED in the delta, effectively retiring the capability.

**Rationale:** Every requirement in that spec concerns the tags feature. There is nothing left to keep. At archive time the capability folder will be cleaned up.

### Decision 4: Clean the `cancel.post.ts` handler inline

**Choice:** Remove only the `tags: null` line from the cancel handler's `.set({...})` payload; leave the rest of the reset logic unchanged.

**Rationale:** Minimal, surgical edit. The handler resets many clinical fields on cancel; we only touch the tags reference.

## Risks / Trade-offs

- **[Risk] Existing rows have tag data that will be lost** -> Mitigation: The field is not surfaced in any UI and the composable is unconsumed, so no user-facing behavior depends on it. Acceptable data loss. The local DB can be re-seeded via `pnpm db:seed`.
- **[Risk] Stale references missed during removal** -> Mitigation: Run `pnpm typecheck` and `pnpm lint` after edits; grep for residual `tags` references in appointment-related code paths.

## Migration Plan

No migration generated (dev phase).

1. Remove all code references (schema, API, types, composable, cancel handler)
2. Run `pnpm typecheck` and `pnpm lint` to confirm no dangling references
3. Re-seed the local database with `pnpm db:seed` if needed to sync schema

**Rollback:** Revert the schema edit to re-add the `tags` column. Re-seed locally. No production data to recover.
