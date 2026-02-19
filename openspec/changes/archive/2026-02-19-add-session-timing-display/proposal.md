# Change: Add Session Timing Display to Treatment Session Slideover

## Why

Therapists need to see comprehensive timing information for treatment sessions, including both planned appointment times and actual session execution times. Currently, the TreatmentSessionSlideover only shows elapsed time in the timer component, but does not provide a complete view of the scheduled vs actual timing, making it difficult to track session adherence and identify patterns like late starts or extended sessions.

## What Changes

- Add new UI section in TreatmentSessionSlideover to display:
  - Appointment scheduled date, start time, and end time
  - Session actual start time and actual end time (when available)
  - Planned duration (from appointment) vs actual duration (from completed sessions)
  - Total paused time (if any pauses occurred during the session)
- Display timing information clearly using existing time formatting utilities
- Show timing information consistently for all session states (not started, in progress, completed)

## Impact

- Affected specs: `treatment-session` (adding display requirements)
- Affected code: `app/components/treatment-session/TreatmentSessionSlideover.vue`
- Dependencies: Uses existing time formatting utilities from `shared/utils/time.ts`
- No breaking changes - pure feature addition
