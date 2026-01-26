# Implementation Tasks

## Phase 1: Database Schema & Migration

1. ~~**Add session tracking fields to consultation schema**~~
   - File: `server/database/schema/consultation.ts`
   - Add 5 new nullable fields: `actualStartTime`, `actualDurationSeconds`, `totalPausedSeconds`, `pauseStartTime`, `tags`
   - Place after existing `status` field
   - Run typecheck to verify no errors

2. ~~**Generate Drizzle migration**~~
   - Run `npx drizzle-kit generate`
   - Verify migration file created in `server/database/migrations/`
   - Review generated SQL contains 5 ALTER TABLE statements

3. ~~**Apply database migration**~~
   - Run `npx drizzle-kit push` for local development
   - Verify new columns exist in database
   - Query schema: `sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite ".schema consultations"`

## Phase 2: Time Utility Functions

4. ~~**Create time utility module**~~
   - File: `app/utils/time.ts` (new)
   - Implement `getCurrentTimeHHMMSS()` for HH:MM:SS format
   - Implement `calculateTimeDifference()` for time string differences in seconds
   - Implement `formatSecondsAsMMSS()` for MM:SS display
   - Implement `formatSecondsAsHHMMSS()` for long durations
   - Implement `getTimeSincePause()` for human-readable pause duration
   - Export all functions

5. ~~**Install dependency**~~
   - Run `npm install @internationalized/date`
   - Verify package added to package.json
   - Run `pnpm install` to update lockfile

## Phase 3: API Endpoints

6. ~~**Create start session endpoint**~~
   - File: `server/api/consultations/[id]/start.post.ts` (new)
   - Validate `actualStartTime` parameter (required, HH:MM:SS format)
   - Check consultation exists and is not already in progress
   - Update status to 'in_progress', set `actualStartTime`, initialize timer fields
   - Return success response with `actualStartTime`
   - Add error handling for 400/404 responses

7. ~~**Create pause session endpoint**~~
   - File: `server/api/consultations/[id]/pause.post.ts` (new)
   - Validate `pauseStartTime` parameter (required, HH:MM:SS format)
   - Check consultation is in_progress and not already paused
   - Set `pauseStartTime` to provided value
   - Return success response with `pauseStartTime`
   - Add error handling for invalid state transitions

8. ~~**Create resume session endpoint**~~
   - File: `server/api/consultations/[id]/resume.post.ts` (new)
   - Check consultation is currently paused (`pauseStartTime` not null)
   - Calculate pause duration from `pauseStartTime` to current time
   - Add pause duration to `totalPausedSeconds`
   - Clear `pauseStartTime` to null
   - Return success response with updated `totalPausedSeconds`
   - Handle midnight crossing in time calculations

9. ~~**Create end session endpoint**~~
   - File: `server/api/consultations/[id]/end.post.ts` (new)
   - Accept optional `actualDurationSeconds` parameter
   - If not provided, calculate from actual start time minus total paused time
   - If still paused, subtract current pause duration from elapsed
   - Update status to 'completed', set `actualDurationSeconds`, clear `pauseStartTime`
   - Save `tags`, `painLevelAfter`, `notes` from body
   - Ensure final duration is non-negative
   - Return success response with `actualDurationSeconds`

10. ~~**Create update tags endpoint**~~

- File: `server/api/consultations/[id]/tags.patch.ts` (new)
- Validate `tags` parameter (optional, must be array if provided)
- Store tags as JSON string or null if empty array
- Update `updatedAt` timestamp
- Return success response with saved tags array

## Phase 4: Component Logic Updates

11. ~~**Add time utility imports to component**~~
    - File: `app/components/consultation/ActiveConsultationSlideover.vue`
    - Import `getCurrentTimeHHMMSS`, `calculateTimeDifference`, `formatSecondsAsMMSS`, `getTimeSincePause`
    - Import `parseTime` from `@internationalized/date`

12. ~~**Update component state variables**~~
    - Replace existing timer refs with new refs
    - Add `selectedTags` ref for tags array
    - Add `actualStartTime` ref for actual session start time
    - Add `pauseStartTime` ref for pause tracking
    - Add `totalPausedSeconds` ref for cumulative pause duration
    - Add `actualDurationSeconds` ref for final therapy time
    - Keep `isPaused` ref for UI pause state

13. ~~**Replace watch effect for consultation data**~~
    - Load `tags` from JSON, handle parse errors
    - Load session tracking fields from database
    - Determine pause state from `pauseStartTime` value
    - Calculate elapsed time based on actual start and paused duration
    - Use current time for running sessions, pause start time for paused sessions
    - Start timer only if status is 'in_progress'

14. ~~**Replace timer function**~~
    - Update `startTimer()` to only increment when not paused
    - Calculate elapsed from actual start time minus total paused seconds
    - Use `getCurrentTimeHHMMSS()` for current time
    - Keep 1-second interval

15. ~~**Implement pause/resume function**~~
    - Replace `pauseTimer()` with async API calls
    - On pause: call `/pause` endpoint with current time
    - On resume: call `/resume` endpoint
    - Update local state after successful API response
    - Recalculate timer after resume
    - Handle errors with notifications

16. ~~**Replace stop function with end session**~~
    - Implement `endSession()` function
    - Calculate actual duration before calling API
    - Call `/end` endpoint with duration, tags, painLevelAfter, notes
    - Handle success (emit events) and errors (show notification)

17. ~~**Implement tag toggle function**~~
    - Create `toggleTag(tag: string)` function
    - Add/remove tag from selected array
    - Auto-save to `/tags` endpoint
    - Revert on API error
    - No user feedback needed (auto-save indicator shows status)

18. ~~**Add computed for pause duration**~~
    - Create `timeSincePause` computed
    - Return `getTimeSincePause(pauseStartTime.value)` or empty string

## Phase 5: Template Updates

19. ~~**Update timer card template**~~
    - Replace existing timer display with new version
    - Add conditional icon (pause/play) based on `isPaused` state
    - Add pulse animation to running timer icon
    - Update status label to show "En pause depuis X" when paused
    - Add pause/resume button (conditionally shows Pause or Reprendre)
    - Keep existing 5-minute warning
    - Use `timeSincePause` for pause duration

20. ~~**Update smart tags section**~~
    - Replace existing tag buttons with toggleable version
    - Show checkmark icon for selected tags
    - Show add icon for unselected tags
    - Use solid/primary for selected, outline/neutral for unselected
    - Wire click events to `toggleTag` function
    - Keep "Gérer les tags" button (placeholder for future)

21. ~~**Update complete handler**~~
    - Replace `handleComplete()` to call `endSession()`
    - Keep confirmation dialog

22. ~~**Test timer display in UI**~~
    - Start a session and verify timer increments every second
    - Verify elapsed time displays correctly (MM:SS)
    - Verify remaining time displays correctly
    - Verify timer shows 00:00 when not started

## Phase 6: Integration with Start Session

23. ~~**Update daily schedule start handler**~~
    - File: `app/pages/therapists/day.vue`
    - Update `handleStartConsultation` to call `/start` endpoint
    - Pass current time as `actualStartTime`
    - Then open ActiveConsultationSlideover

24. ~~**Update planning slideover start handler**~~
    - File: `app/components/consultation/PlanningSlideover.vue`
    - Update `handleStartConsultation` to call `/start` endpoint
    - Pass current time as `actualStartTime`
    - Then open ActiveConsultationSlideover

## Phase 7: Cross-Device Sync

25. ~~**Add periodic data refresh**~~
    - Add `syncInterval` variable to component
    - In `onMounted`, start 30-second interval to refresh consultation data
    - In `onUnmounted`, clear interval
    - Use existing `refreshConsultation` from composable

## Phase 8: Error Handling & UX

26. ~~**Add loading states for pause/resume**~~
    - Add `isPausing` and `isResuming` refs
    - Set to true/false around API calls
    - Add `:loading` and `:disabled` props to pause/resume button

27. ~~**Add error notifications**~~
    - Import and use toast/notification system
    - Add error messages for pause/resume/end failures
    - Add error message for tag save failure
    - Use appropriate colors (error)

## Phase 9: Testing

28. ~~**Database migration test**~~
    - Run migration generation again to verify idempotency
    - Check existing records still work (nullable fields)
    - Test inserting new consultation with new fields
    - Test updating existing consultation to set new fields

29. ~~**API endpoint tests**~~
    - Test start endpoint with valid and invalid data
    - Test pause/resume cycle
    - Test ending session with and without provided duration
    - Test tags endpoint with create, update, and clear operations
    - Verify error responses for invalid states

30. ~~**UI component tests**~~
    - Start session, pause, resume, end sequence
    - Verify pause duration displays correctly
    - Verify timer accumulates correctly across multiple pauses
    - Test tag selection and auto-save
    - Test cross-device sync (simulate via API)
    - Test edge cases: midnight crossing, long pauses, multiple pause cycles

31. ~~**Integration tests**~~
    - Start session from daily schedule
    - Start session from planning slideover
    - Verify timer starts correctly
    - Complete session and verify data saved
    - Verify consultation status updates across views

32. ~~**Type checking and linting**~~
    - Run typecheck: `pnpm typecheck` (verify command)
    - Run linter: `pnpm lint` (verify command)
    - Fix any reported errors

## Phase 10: Documentation & Cleanup

33. ~~**Update project documentation**~~
    - Document new fields in database schema comments
    - Document API endpoints in API reference
    - Update any relevant developer documentation

34. ~~**Clean up old timer code**~~
    - Remove unused `getConsultationStartDateTime` function if no longer needed
    - Remove any dead code from original timer implementation
    - Ensure no commented-out old code remains
