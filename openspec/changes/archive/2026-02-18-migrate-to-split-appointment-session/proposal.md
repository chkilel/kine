# Change: Migrate to Split Appointment-Treatment Session Architecture

## Why

Currently, the system conflates scheduling concerns (appointments) with clinical session state (in-progress tracking, notes, pain levels) in a single table. This creates several issues:

1. **Data Integrity**: Appointments exist before sessions start, but clinical data (pain levels, notes, timer state) only makes sense once therapy begins
2. **Separation of Concerns**: Scheduling (date, time, room) should be independent from clinical documentation (observations, treatment summary, next steps)
3. **Flexibility**: Future requirements like walk-in sessions or group therapy need a cleaner domain model
4. **Audit Trail**: Having separate tables creates clearer history - what was scheduled vs. what actually happened

The new schema already exists with `appointments` handling scheduling and `treatmentSessions` handling clinical sessions with a 1:0..1 relationship.

## What Changes

### Database Layer

- Remove session-state fields from `appointments` table (actualStartTime, actualDurationSeconds, totalPausedSeconds, pauseStartTime, extendedDurationMinutes, painLevelBefore, painLevelAfter, notes, tags)
- Treatment session records are created lazily when therapist clicks "Start Session" (not at appointment creation)
- Appointment status for scheduling lifecycle (scheduled, confirmed, cancelled, no_show, completed)
- Treatment session has its own clinical status (in_progress, completed) and step tracking (pre-session, assessment, treatment, etc.)
- Appointment.status = 'completed' is set when treatment session is completed (for quick scheduling view)

### API Layer

- Session lifecycle actions (start, pause, resume, end) move from `/api/appointments/[id].patch` to `/api/treatment-sessions` endpoints
- Session timer state is read from treatment session, not appointment
- Appointment endpoints focus on CRUD operations for scheduling only
- New endpoints for treatment session management

### Frontend Layer

- `ConsultationSlideover` and `ConsultationTimerCard` read/write treatment session data
- `useTherapistAppointments` returns appointments without session state; new composable `useTreatmentSession` for clinical data
- Therapist daily view shows appointments but clicking "Start" creates a treatment session and opens it
- Session state (in_progress) moves from appointment to treatment session

### Type System

- Separate types for `Appointment` (scheduling) and `TreatmentSession` (clinical)
- Update validation schemas to reflect new boundaries

## Impact

### Affected Specs

- `session-timer-management` - Move timer state from appointment to treatment session
- `therapist-daily-schedule` - Start session creates treatment session, status tracking changes
- `appointment-planning` - Simplified to scheduling only, remove clinical fields
- `consultation-planning` - Update to use treatment session for clinical data
- `treatment-session` - New spec for treatment session domain

### Affected Code

- `server/database/schema/appointment.ts` - Remove clinical fields
- `server/database/schema/treatment-session.ts` - Ensure all clinical fields present
- `server/api/appointments/[id].patch.ts` - Remove session actions
- `server/api/treatment-sessions/index.post.ts` - Create treatment session endpoint
- `server/api/treatment-sessions/[id].get.ts` - Get treatment session endpoint
- `server/api/treatment-sessions/[id].patch.ts` - Update treatment session endpoint
- `server/api/treatment-sessions/index.get.ts` - List treatment sessions endpoint
- `app/composables/useAppointment.ts` - Remove session actions
- `app/composables/useTreatmentSession.ts` - New composable
- `app/components/consultation/ConsultationSlideover.vue` - Use treatment session
- `app/components/consultation/ConsultationTimerCard.vue` - Use treatment session
- `app/pages/therapists/day.vue` - Start session creates treatment session

### Clean Slate Approach

Since the project is in active development, we will:

- Directly modify existing code without maintaining backwards compatibility
- Delete old code paths immediately (no deprecation period)
- Update all type definitions in one pass
- No data migration needed (fresh database or development reset acceptable)
- Deploy as atomic change (backend + frontend together)
