## 1. Backend API Updates

- [x] 1.1 Add `updateClinicalNotesActionSchema` to `shared/types/treatment-session.ts` with optional fields: primaryConcern, treatmentSummary, observations, nextSteps
- [x] 1.2 Add `updateClinicalNotes` to `TreatmentSessionActionType` union
- [x] 1.3 Add `updateClinicalNotes` action case to `server/api/treatment-sessions/[id].patch.ts`
- [x] 1.4 Update `detectActionBySchema` function to recognize updateClinicalNotes action
- [x] 1.5 Validate updateClinicalNotes action is allowed from pre_session, in_progress, or finished status based on which fields are being updated
- [x] 1.6 Prevent updating observations in pre_session status
- [x] 1.7 Prevent updating nextSteps before finished status
- [ ] 1.8 Add API endpoint tests for updateClinicalNotes action at different statuses

## 2. Frontend Composable Updates

- [x] 2.1 Add `UpdateClinicalNotesParams` type to `app/composables/useTreatmentSession.ts`
- [x] 2.2 Add `updateClinicalNotes` and `updateClinicalNotesAsync` methods to `useTreatmentSessionActions`
- [x] 2.3 Update mutation to handle updateClinicalNotes action type
- [x] 2.4 Ensure cache invalidation includes treatment session queries

## 3. UI Component Updates - TreatmentSessionSlideover

- [x] 3.1 Add form state refs for `primaryConcern`, `observations`, and `nextSteps`
- [x] 3.2 Initialize form state from treatment session data in watch effect
- [x] 3.3 Add computed property `showPrimaryConcern` to check if appointment has no treatment plan (visible in all statuses)
- [x] 3.4 Add computed property `showObservations` to check if session status is 'in_progress' or 'finished' or 'completed'
- [x] 3.5 Add computed property `showNextSteps` to check if session status is 'finished' or 'completed'
- [x] 3.6 Add `handleSaveClinicalNotes` function to save notes on button click
- [x] 3.7 Add loading state for each field's save button
- [x] 3.8 Add logic to auto-create treatment session ONLY when save button is clicked on first field and no session exists
- [x] 3.9 Ensure NO session is created when opening slideover without clicking save
- [x] 3.10 Add `primaryConcern` textarea field with conditional visibility (v-if="showPrimaryConcern")
- [x] 3.11 Add save button for primaryConcern field
- [x] 3.12 Add `treatmentSummary` textarea field (visible and editable in all statuses)
- [x] 3.13 Add save button for treatmentSummary field
- [x] 3.14 Add `observations` textarea field with conditional visibility (v-if="showObservations")
- [x] 3.15 Add save button for observations field
- [x] 3.16 Add `nextSteps` textarea field with conditional visibility (v-if="showNextSteps")
- [x] 3.17 Add save button for nextSteps field
- [x] 3.18 Group text area fields and their save buttons in logical UI layout sections based on status
- [x] 3.19 Add loading indicators on save buttons during API calls

## 4. Testing & Validation

- [ ] 4.1 Test primaryConcern is shown only when appointment has no treatment plan (visible in all statuses)
- [ ] 4.2 Test primaryConcern can be edited in pre_session status
- [ ] 4.3 Test primaryConcern can be edited in in_progress status
- [ ] 4.4 Test primaryConcern can be edited in finished status
- [ ] 4.5 Test treatmentSummary can be edited in pre_session status
- [ ] 4.6 Test treatmentSummary can be edited in in_progress status
- [ ] 4.7 Test treatmentSummary can be edited in finished status
- [ ] 4.8 Test save button for primaryConcern saves field content
- [ ] 4.9 Test save button for treatmentSummary saves field content
- [ ] 4.10 Test save button for observations saves field content
- [ ] 4.11 Test save button for nextSteps saves field content
- [ ] 4.12 Test filling primaryConcern and clicking save creates session in pre_session status (when no session exists)
- [ ] 4.13 Test filling treatmentSummary and clicking save creates session in pre_session status (when no session exists)
- [ ] 4.14 Test NO session is created when opening slideover without filling any fields
- [ ] 4.15 Test NO session is created when filling fields without clicking save
- [ ] 4.16 Test starting session directly without filling notes works (bypasses pre_session)
- [ ] 4.17 Test observations field is hidden in pre_session status
- [ ] 4.18 Test observations field appears and is editable in in_progress status
- [ ] 4.19 Test observations field remains editable in finished status
- [ ] 4.20 Test nextSteps field is hidden in pre_session and in_progress status
- [ ] 4.21 Test nextSteps field appears and is editable in finished status
- [ ] 4.22 Test all clinical notes persist correctly through status transitions
- [ ] 4.23 Test loading indicators appear on save buttons during API calls
