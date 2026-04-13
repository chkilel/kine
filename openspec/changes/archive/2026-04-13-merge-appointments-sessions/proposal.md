## Why

The current split between `appointments` (scheduling lifecycle) and `treatment_sessions` (clinical lifecycle) creates two separate state machines that must stay synchronized. This produces bug-prone scenarios: session created but appointment status not updated, session completed but appointment still shows `in_session`, appointment cancelled but session has data, timer running on session while appointment is no-show. Merging into a single unified table eliminates the sync problem entirely — one table, one state machine, zero sync bugs. This is a fresh project with no production data, so no migration complexity.

## What Changes

- **BREAKING**: Delete the `treatment_sessions` table and all related API routes (`/api/treatment-sessions/*`)
- **BREAKING**: Rewrite the `appointments` table schema to absorb all clinical, billing, timer, and locking fields from `treatment_sessions`
- **BREAKING**: Replace two status enums (`APPOINTMENT_STATUSES` + `TREATMENT_SESSION_STATUSES`) with one unified status: `scheduled → confirmed → in_progress → finished → completed`, plus `cancelled` and `no_show`
- Rewrite all API routes to operate on the merged `appointments` table (start, pause, resume, end, cancel, clinical-notes, tags, cost, extend actions become appointment sub-routes)
- Update all composables (`useTreatmentSession`, `useAppointment`) to work with the unified model
- Update all UI components (daily schedule cards, consultation slideover, treatment session slideover, billing page) to use unified status and field names
- Update `server/database/relations.ts` to remove `treatmentSessions` relations and add `service`, `lockedBy` relations on `appointments`
- Update `payment_session_items` to reference `appointmentId` instead of `treatmentSessionId`
- Update shared types, constants, and validation schemas
- Update database seeder (`server/api/db/seed.post.ts`) to use unified field names and status values
- Generate and apply database migration

## Capabilities

### New Capabilities

- `unified-appointment-session`: Merged appointment + treatment session model with unified state machine, clinical fields, billing fields, timer management, and locking — replacing the two-table approach

### Modified Capabilities

- `treatment-session`: All requirements absorbed into `unified-appointment-session`. This spec becomes obsolete and should be archived/removed after implementation.
- `session-timer-management`: Timer endpoints move from `/api/treatment-sessions/[id]/*` to `/api/appointments/[id]/*`. All timing logic (pause, resume, elapsed calculation) remains identical but operates on the unified appointment record.
- `therapist-daily-schedule`: Daily schedule view references unified appointment status instead of separate appointment + treatment session statuses. Card actions (start, continue, view) map to unified statuses (`scheduled`/`confirmed` → start, `in_progress` → continue, `finished`/`completed` → view).
- `payment-tracking`: `payment_session_items` FK changes from `treatmentSessionId` to `appointmentId`. Session payment status enrichment queries join against `appointments` instead of `treatment_sessions`. Receipts reference appointment data.
- `consultation-planning`: Room availability queries remain on `appointments` table (unchanged), but booking validation now checks unified status field.

## Impact

- **Database**: D1 schema migration — drop `treatment_sessions` table, alter `appointments` table (add 15+ columns), drop/recreate indexes, update `payment_session_items` FK
- **API**: All `/api/treatment-sessions/*` routes removed; equivalent functionality moved to `/api/appointments/[id]/*` sub-routes (start, pause, resume, end, cancel, clinical-notes, tags, cost, extend)
- **Shared types**: `TREATMENT_SESSION_STATUSES` deleted; `APPOINTMENT_STATUSES` expanded; new `APPOINTMENT_PAYMENT_STATUSES` type added; treatment session types deleted or refactored to appointment types
- **Composables**: `useTreatmentSession` composable removed; logic absorbed into `useAppointment`; all consumers updated
- **UI components**: `TreatmentSessionSlideover` reworked or merged with consultation UI; daily schedule cards use unified status; billing page queries updated
- **Seeder**: Update `generateAppointments()` to use merged field names (`primaryConcern` instead of `chiefComplaint`), remove obsolete fields (`billed`, `insuranceClaimed`), use unified status values (`in_progress`/`finished` for past completed appointments), add timer fields for in_progress appointments
- **Org isolation**: No change — same organization-scoped access patterns apply to the merged table
