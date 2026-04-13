## Context

Kine currently uses two separate tables for managing consultations:

- **`appointments`** — scheduling lifecycle (scheduled → confirmed → completed/cancelled/no_show)
- **`treatment_sessions`** — clinical lifecycle (pre_session → in_progress → finished → completed/canceled)

These are linked 1:1 via `treatmentSessions.appointmentId`. The split creates synchronization complexity: every status transition in one table must be reflected in the other, and several bugs have resulted from desync (timer running while appointment cancelled, session completed but appointment stuck in `in_session`, etc.).

54 files across the codebase reference treatment sessions. The project has no production data, so this is a pure schema restructuring with zero data migration.

## Goals / Non-Goals

**Goals:**

- Merge `appointments` and `treatment_sessions` into a single table with a unified state machine
- Preserve all existing functionality: scheduling, clinical notes, timer (pause/resume), EVA capture, billing, locking, tags, price inheritance
- Simplify the codebase by eliminating the treatment-session abstraction layer
- Maintain org-scoped data isolation throughout

**Non-Goals:**

- Changing the payment/ledger system (payments table stays as-is, only FK column name changes)
- Adding new features or workflow changes
- Modifying the room booking / availability logic
- Changing the billing page UI layout
- Renaming the `TreatmentSessionSlideover` component (it becomes the consultation detail view but retains similar structure)

## Decisions

### D1: Unified Status Machine

**Decision**: Replace two separate status enums with one: `scheduled → confirmed → in_progress → finished → completed`, plus `cancelled` and `no_show`.

**Rationale**: The `pre_session` status from treatment sessions is eliminated. Clinical notes (primaryConcern, treatmentSummary) can be saved directly on the appointment in `scheduled`/`confirmed` status without needing a separate pre_session phase. The session is "started" by transitioning to `in_progress`, which sets `actualStartTime` and `painLevelBefore`.

**Alternative considered**: Keep `pre_session` in the unified model. Rejected because it adds unnecessary state — notes can be saved on any appointment regardless of session status.

### D2: Column Merging Strategy

**Decision**: Absorb all `treatment_sessions` columns into the `appointments` table. Nullable columns for clinical fields (null = not yet filled). Timer columns (`pauseStartTime`, `totalPausedSeconds`, `actualDurationSeconds`) become nullable on the appointment.

**Rationale**: Simpler than maintaining a junction or separate clinical table. SQLite handles nullable columns well with no storage overhead for null values.

**Field mapping**:
| treatment_sessions | appointments (merged) | Notes |
|---|---|---|
| id | (removed, use appointment.id) | 1:1 merge |
| appointmentId | (removed, implicit) | Same row |
| patientId | (already exists) | Keep existing |
| therapistId | (already exists) | Keep existing |
| treatmentPlanId | (already exists) | Keep existing |
| primaryConcern | primaryConcern | New nullable column |
| treatmentSummary | treatmentSummary | New nullable column |
| observations | observations | New nullable column |
| nextSteps | nextSteps | New nullable column |
| painLevelBefore | painLevelBefore | New nullable column |
| painLevelAfter | painLevelAfter | New nullable column |
| status | status | Unified enum |
| actualStartTime | actualStartTime | New nullable column |
| actualDurationSeconds | actualDurationSeconds | New nullable column |
| totalPausedSeconds | totalPausedSeconds | New nullable column |
| pauseStartTime | pauseStartTime | New nullable column |
| extendedDurationMinutes | extendedDurationMinutes | New nullable column, default 0 |
| tags | tags | New nullable column |
| insuranceClaimed | (removed) | Handled by payment system |
| priceCent | priceCents | New column, not null, default 0 |

**New columns not from treatment_sessions**:

- `isLocked` (boolean) — read-only lock
- `lockedAt` (timestamp) — when locked
- `lockedById` (text FK) — who locked

### D3: API Route Restructuring

**Decision**: Delete `server/api/treatment-sessions/` directory entirely. Move all session actions as sub-routes on appointments: `POST /api/appointments/[id]/start`, `POST /api/appointments/[id]/pause`, `POST /api/appointments/[id]/resume`, `POST /api/appointments/[id]/end`, `POST /api/appointments/[id]/cancel`, `PATCH /api/appointments/[id]/clinical-notes`, `PATCH /api/appointments/[id]/tags`, `PATCH /api/appointments/[id]/price`, `PATCH /api/appointments/[id]/extend`.

**Rationale**: Since the appointment IS the session, the resource identity is clear. Sub-routes maintain RESTful semantics for state transitions. The existing `GET /api/appointments` and `GET /api/appointments/[id]` already return session data when `include=treatmentSession` — post-merge this becomes the default behavior.

**Alternative considered**: Keep `/api/treatment-sessions` as a redirect/alias layer. Rejected — adds complexity for no benefit.

### D4: payment_session_items FK Rename

**Decision**: Rename `treatmentSessionId` column to `appointmentId` in `payment_session_items` table.

**Rationale**: Direct reflection of the merged model. Payment items now link to the appointment (which IS the session). The index on this column is updated accordingly.

### D5: Composable Consolidation

**Decision**: Remove `useTreatmentSession.ts` composable. Move all session action composables into `useAppointment.ts`. Keep backward-compatible function names where possible (e.g., `useStartAppointment` alongside the moved logic).

**Rationale**: One composable per domain entity. The appointment composable already exists and manages list/detail queries. Adding session actions there is natural. Cache keys change from `TREATMENT_SESSION_KEYS` to `APPOINTMENT_KEYS`.

### D6: TreatmentSessionSlideover → ConsultationDetailSlideover

**Decision**: Rename `TreatmentSessionSlideover.vue` to `ConsultationDetailSlideover.vue` (or keep the name but update internals). The component already receives an appointment and its optional treatment session — post-merge it receives a single unified appointment object.

**Rationale**: The slideover is the primary UI for interacting with a consultation. Updating its name to reflect the merged model avoids confusion. Internal components (`SlideoverLeftSide`, `SlideoverCenter`, `TreatmentSessionTimer`, `TreatmentSessionPrice`, `TreatmentSessionTimingCard`) stay in the `treatment-session/` component folder or move to `consultation/` — minimal disruption.

### D7: Type System Simplification

**Decision**: Delete `shared/types/treatment-session.type.ts`. Move action schemas (start, pause, resume, end, clinical-notes, tags, price, extend) into `shared/types/appointment.type.ts`. Update `Appointment` type to include clinical/timer/billing fields directly. Remove `AppointmentWithSession` type (no longer needed — all appointments have session fields inline).

**Rationale**: One source of truth for appointment/session types. The action schemas remain identical in shape — only their parent module changes.

### D8: Database Migration Approach

**Decision**: Single destructive migration: drop `treatment_sessions` table, add columns to `appointments`, rename column in `payment_session_items`, recreate indexes.

**Rationale**: No production data exists. A single migration is simpler than incremental steps. `pnpm db:gen` generates the SQL; `pnpm db:mig` applies it locally.

## Risks / Trade-offs

- **[54 files to modify]** → Mitigation: Task breakdown into clear phases (schema → types → API → composables → UI). Each phase is independently testable.
- **[Breaking API contracts]** → Mitigation: Frontend and backend change simultaneously since this is a monorepo. No external API consumers exist.
- **[Wider appointments table]** → Mitigation: SQLite stores nulls efficiently. The clinical columns are text/integer with no indexes. Query patterns remain indexed by organizationId/patientId/date/status.
- **[Loss of pre_session semantics]** → Mitigation: The `scheduled` status already covers "appointment created, not started." Clinical notes are saveable in any status, eliminating the need for pre_session.
- **[Naming confusion during transition]** → Mitigation: Rename `treatment_session*` references to `appointment*` consistently. Use search-and-replace for mechanical changes, then manual review for semantic ones.
