# Tasks: Add Enhanced Treatment Session Statuses

## 1. Update Constants and Types

- [x] 1.1 Add new statuses (`pre_session`, `finished`, `canceled`) to `TREATMENT_SESSION_STATUSES`
- [x] 1.2 Remove `TREATMENT_SESSION_STEPS` constant entirely
- [x] 1.3 Remove `TREATMENT_SESSION_STEP_CONFIG` and step helper functions
- [x] 1.4 Remove `treatmentSessionStepSchema` from `base.types.ts`
- [x] 1.5 Add configuration entries for new statuses in `TREATMENT_SESSION_STATUS_CONFIG` with labels, colors, icons, and descriptions
- [x] 1.6 Verify Zod schema auto-updates from constant array
- [x] 1.7 Add `cancelActionSchema` to `shared/types/treatment-session.ts`
- [x] 1.8 Add `cancel` to `TreatmentSessionActionType` union type
- [x] 1.9 Add `cancel` to `treatmentSessionPatchSchema` union
- [x] 1.10 Update `treatmentSessionCreateSchema` default status to `pre_session`
- [x] 1.11 Update `treatmentSessionQuerySchema` status enum to include new statuses
- [x] 1.12 Remove `sessionStep` from `treatmentSessionSchema` and related types in `treatment-session.type.ts`

## 2. Update Database Schema

- [x] 2.1 Update `treatmentSessions` table default status from `in_progress` to `pre_session`
- [x] 2.2 Verify enum constraint includes all five statuses
- [x] 2.3 Remove `sessionStep` column from `treatmentSessions` table
- [x] 2.4 Create database migration to drop `sessionStep` column (if needed)

## 3. Update API Endpoints

- [x] 3.1 Update `server/api/treatment-sessions/index.post.ts` to create sessions with `pre_session` status
- [x] 3.2 Remove `painLevelBefore` from session creation endpoint
- [x] 3.3 Remove `sessionStep` initialization from create endpoint
- [x] 3.4 Update `start` action schema to require `painLevelBefore` and `actualStartTime`
- [x] 3.5 Add `cancel` action detection in `server/api/treatment-sessions/[id].patch.ts`
- [x] 3.6 Add state validation for `cancel` action (only from `pre_session` or `in_progress`)
- [x] 3.7 Update `end` action to set status to `finished` instead of `completed`
- [x] 3.8 Remove `sessionStep` update from `end` action
- [x] 3.9 Add billing detection to auto-transition `finished` → `completed` when `billed` field is set
- [x] 3.10 Add success message for cancel action
- [x] 3.11 Update state validation for other actions to account for new statuses

## 4. Update Frontend Components (if needed)

- [x] 4.1 Update any hardcoded status references to use snake_case format
- [x] 4.2 Remove all references to `TREATMENT_SESSION_STEPS`
- [x] 4.3 Remove all references to `sessionStep` field
- [x] 4.4 Update status display components to show all five statuses
- [ ] 4.5 Add cancel button/action in UI for sessions in `pre_session` or `in_progress`
- [x] 4.6 Update UI to handle automatic status transition when billing is set (finished status handling)
- [x] 4.7 Update status transition validation in frontend
- [x] 4.8 Replace step-based UI navigation with status-based navigation

## 5. Testing

- [ ] 5.1 Test creating treatment session with `pre_session` status (no painLevelBefore)
- [ ] 5.2 Test starting session with painLevelBefore via modal (pre_session → in_progress)
- [ ] 5.3 Test canceling EVA modal before starting (remains in pre_session)
- [ ] 5.4 Test ending session (in_progress → finished)
- [ ] 5.5 Test billing session (finished → completed)
- [ ] 5.6 Test canceling session from pre_session (pre_session → canceled)
- [ ] 5.7 Test canceling session from in_progress (in_progress → canceled)
- [ ] 5.8 Test preventing cancel from finished or completed
- [ ] 5.9 Test preventing cancel if already canceled
- [ ] 5.10 Verify status labels, colors, and icons display correctly
- [ ] 5.11 Test query filtering by each status
- [ ] 5.12 Test that billing a non-finished session doesn't change status
- [ ] 5.13 Verify database migration handles dropping `sessionStep` column
- [ ] 5.14 Verify existing sessions work after `sessionStep` removal
- [ ] 5.15 Test that painLevelBefore is set when starting session
- [ ] 5.16 Test that painLevelBefore is null when session is created in pre_session

## 6. Documentation

- [x] 6.1 Verify all scenarios in spec delta are covered by implementation
- [x] 6.2 Update any inline comments referencing old status workflow
- [x] 6.3 Update any inline comments referencing `sessionStep`
- [x] 6.4 Confirm changes align with spec requirements
