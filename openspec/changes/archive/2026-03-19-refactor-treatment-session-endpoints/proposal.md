# Change: Refactor treatment session actions into separate RESTful endpoints

## Why

The current monolithic PATCH endpoint `/api/treatment-sessions/[id]` uses a complex union schema that requires careful ordering to prevent schemas with all optional fields from "stealing" matches from more specific schemas. Action detection via `detectActionBySchema()` adds runtime overhead and creates ambiguous semantics—PATCH { cost: 10950 } doesn't clearly indicate intent. A single endpoint handling 9 different operations creates complexity in testing, debugging, and maintenance.

## What Changes

- **BREAKING**: Replace monolithic PATCH endpoint with 9 separate RESTful endpoints
- Add dedicated endpoints for each treatment session action:
  - POST `/api/treatment-sessions/[id]/start` - Start session with pain level
  - POST `/api/treatment-sessions/[id]/pause` - Pause session for breaks
  - POST `/api/treatment-sessions/[id]/resume` - Resume paused session
  - POST `/api/treatment-sessions/[id]/end` - End session with final pain level
  - POST `/api/treatment-sessions/[id]/cancel` - Cancel session (no-show or accidental start)
  - PATCH `/api/treatment-sessions/[id]/tags` - Update session tags
  - PATCH `/api/treatment-sessions/[id]/extend` - Extend session duration
  - PATCH `/api/treatment-sessions/[id]/cost` - Update session cost
  - PATCH `/api/treatment-sessions/[id]/clinical-notes` - Update clinical notes
- Split monolithic `_useTreatmentSessionActions` composable into 9 focused composables:
  - `useStartTreatmentSession`
  - `usePauseTreatmentSession`
  - `useResumeTreatmentSession`
  - `useEndTreatmentSession`
  - `useCancelTreatmentSession`
  - `useUpdateSessionTags`
  - `useExtendSession`
  - `useUpdateSessionCost`
  - `useUpdateClinicalNotes`
- Remove `detectActionBySchema()` action detection (not needed with explicit endpoints)
- Extract `validateActionState()` to shared utility for state transition validation
- Maintain all existing validation logic and business rules per action
- Preserve all state transition constraints and error messages

## Impact

- **Affected specs**: treatment-session (all PATCH scenarios will be MODIFIED to use new endpoints)
- **Affected code**:
  - `server/api/treatment-sessions/[id].patch.ts` (REPLACE with 9 new endpoint files)
  - `app/composables/useTreatmentSession.ts` (REPLACE with 9 focused composables)
  - `shared/types/treatment-session.type.ts` (REMOVE union schema, keep individual action schemas)
  - All components using `useTreatmentSessionActions` (UPDATE imports)
- **Benefits**:
  - Explicit actions via URL, no action detection needed
  - Clear HTTP semantics (POST for state transitions, PATCH for updates)
  - Type-safe composables per action with better tree-shaking
  - Easier testing and debugging with isolated endpoints
  - No union schema ordering issues or action detection overhead
