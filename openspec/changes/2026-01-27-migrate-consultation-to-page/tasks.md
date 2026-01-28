# Tasks: Migrate Consultation to Page

## Phase 1: Page Structure & Pre-Session

### 1.1 Create consultation page structure

- [ ] 1.1.1 Create `/pages/consultations/[id].vue`
- [ ] 1.1.2 Add route parameter handling for consultation ID
- [ ] 1.1.3 Add query parameter handling for step (`pre-session`, `active-session`, `post-session`, `summary`)
- [ ] 1.1.4 Set default step to `pre-session` if not provided
- [ ] 1.1.5 Add loading state for consultation data
- [ ] 1.1.6 Add error handling for missing consultation

### 1.2 Implement step navigation

- [ ] 1.2.1 Create `ConsultationStepProgress.vue` component
- [ ] 1.2.2 Display 4-step progress indicator
- [ ] 1.2.3 Highlight current step
- [ ] 1.2.4 Add click navigation to completed steps
- [ ] 1.2.5 Add validation to prevent skipping steps

### 1.3 Migrate patient info sidebar

- [ ] 1.3.1 Move `ConsultationPatientProfileCard.vue` to page layout
- [ ] 1.3.2 Ensure patient data loads on mount
- [ ] 1.3.3 Add responsive collapse functionality
- [ ] 1.3.4 Test on desktop/tablet/mobile

### 1.4 Implement pre-session step

- [ ] 1.4.1 Create `PreSessionStep.vue` component
- [ ] 1.4.2 Integrate `ConsultationEvaCard.vue`
- [ ] 1.4.3 Integrate `ConsultationTimerCard.vue` (disabled state)
- [ ] 1.4.4 Implement "Démarrer" button logic
- [ ] 1.4.5 Validate EVA before enabling start
- [ ] 1.4.6 Handle "Évaluation Non nécessaire" toggle

### 1.5 Connect consultation action for starting session

- [ ] 1.5.1 Use `consultationAction.startAsync()` on start
- [ ] 1.5.2 Set actualStartTime to current time
- [ ] 1.5.3 Update consultation status to `in_progress`
- [ ] 1.5.4 Navigate to `?step=active-session` on success
- [ ] 1.5.5 Show error toast on failure

## Phase 2: Active Session Step

### 2.1 Implement active session step

- [ ] 2.1.1 Create `ActiveSessionStep.vue` component
- [ ] 2.1.2 Integrate `ConsultationEditor.vue` (notes + tags)
- [ ] 2.1.3 Integrate `ConsultationTimerCard.vue` (active state)
- [ ] 2.1.4 Integrate `ConsultationPreviousNotes.vue`
- [ ] 2.1.5 Add auto-save mechanism for notes
- [ ] 2.1.6 Add auto-save mechanism for tags

### 2.2 Implement timer functionality

- [ ] 2.2.1 Ensure timer syncs with database
- [ ] 2.2.2 Handle pause/resume actions
- [ ] 2.2.3 Handle extend session action
- [ ] 2.2.4 Show 5-minute warning
- [ ] 2.2.5 Auto-refresh consultation data every 30s

### 2.3 Implement stop action

- [ ] 2.3.1 Add "Terminer" button to timer card
- [ ] 2.3.2 Show confirmation modal on click
- [ ] 2.3.3 Pause timer on confirmation
- [ ] 2.3.4 Navigate to `?step=post-session` on confirm

## Phase 3: Post-Session Step

### 3.1 Create post-session step

- [ ] 3.1.1 Create `PostSessionStep.vue` component
- [ ] 3.1.2 Create `ConsultationEvaFinalCard.vue` (NEW)
  - [ ] 3.1.2.1 EVA slider for final pain level
  - [ ] 3.1.2.2 Validate button
  - [ ] 3.1.2.3 Read-only notes display
  - [ ] 3.1.2.4 Read-only tags display

### 3.2 Implement pain differential calculation

- [ ] 3.2.1 Create `PainDifferentialDisplay.vue` (NEW)
  - [ ] 3.2.1.1 Calculate differential (after - before)
  - [ ] 3.2.1.2 Display green for improvement (< 0)
  - [ ] 3.2.1.3 Display red for worsening (> 0)
  - [ ] 3.2.1.4 Display gray for stable (= 0)
  - [ ] 3.2.1.5 Show message: "Douleur diminuée/augmentée/stable de X points"

### 3.3 Implement finalize action

- [ ] 3.3.1 Add "Confirmer et Continuer" button
- [ ] 3.3.2 Save painLevelAfter to consultation
- [ ] 3.3.3 Update consultation status to `completed`
- [ ] 3.3.4 Calculate actualDurationSeconds
- [ ] 3.3.5 Navigate to `?step=summary` on success

## Phase 4: Summary Step

### 4.1 Create summary step

- [ ] 4.1.1 Create `SummaryStep.vue` component
- [ ] 4.1.2 Display consultation completion message
- [ ] 4.1.3 Show session duration
- [ ] 4.1.4 Show plan progress update

### 4.2 Implement analytics chart

- [ ] 4.2.1 Create `ConsultationAnalyticsChart.vue` (NEW)
  - [ ] 4.2.1.1 Fetch all consultations for patient
  - [ ] 4.2.1.2 Extract pain levels (before and after)
  - [ ] 4.2.1.3 Plot line chart with pain over time
  - [ ] 4.2.1.4 Highlight latest session
  - [ ] 4.2.1.5 Show trend line
  - [ ] 4.2.1.6 Add tooltip on hover

### 4.3 Implement billing section

- [ ] 4.3.1 Create `ConsultationBillingSection.vue` (NEW)
  - [ ] 4.3.1.1 Display consultation duration
  - [ ] 4.3.1.2 Calculate billing amount
  - [ ] 4.3.1.3 Show payment status (pending/paid)
  - [ ] 4.3.1.4 Add "Marquer comme payé" button
  - [ ] 4.3.1.5 Update billing status on click

### 4.4 Implement next appointment booking

- [ ] 4.4.1 Create `NextAppointmentBooking.vue` (NEW)
  - [ ] 4.4.1.1 "Prendre prochain rendez-vous" button
  - [ ] 4.4.1.2 Open PlanningSlideover on click
  - [ ] 4.4.1.3 Pre-select patient
  - [ ] 4.4.1.4 Suggest date based on plan frequency
  - [ ] 4.4.1.5 Close slideover on booking complete
  - [ ] 4.4.1.6 Show confirmation toast

### 4.5 Add navigation actions

- [ ] 4.5.1 Add "Retour au tableau de bord" button → navigate to `/therapists/day`
- [ ] 4.5.2 Add "Voir dossier patient" button → navigate to `/patients/[id]?tab=seances`
- [ ] 4.5.3 Refresh consultation list on dashboard return

## Phase 5: Update Integration Points

### 5.1 Update therapist day page

- [ ] 5.1.1 Open `app/pages/therapists/day.vue`
- [ ] 5.1.2 Replace `activeConsultationOverlay.open()` with `navigateTo()`
- [ ] 5.1.3 Update `handleStartSession()` to navigate instead of open overlay
- [ ] 5.1.4 Update `handleViewSession()` to navigate instead of open overlay
- [ ] 5.1.5 Test navigation from day page
- [ ] 5.1.6 Remove overlay creation if no longer needed

### 5.2 Update planning slideover

- [ ] 5.2.1 Open `app/components/consultation/PlanningSlideover.vue`
- [ ] 5.2.2 Replace `activeConsultationOverlay.open()` with `navigateTo()`
- [ ] 5.2.3 Update `handleStartSession()` to navigate
- [ ] 5.2.4 Test navigation from planning slideover
- [ ] 5.2.5 Remove overlay creation if no longer needed

### 5.3 Add navigation from patient sessions tab

- [ ] 5.3.1 Open `app/components/patient/sessions-tab/SessionsTab.vue`
- [ ] 5.3.2 Add "View Active Session" button for in_progress consultations
- [ ] 5.3.3 Implement `viewActiveSession()` function
- [ ] 5.3.4 Show button only when `status === 'in_progress'`
- [ ] 5.3.5 Test navigation from patient sessions

### 5.4 Update consultation cards

- [ ] 5.4.1 Check `ConsultationCard.vue` for any direct slideover opens
- [ ] 5.4.2 Update to use navigateTo if needed
- [ ] 5.4.3 Check `ConsultationActiveCard.vue` for any direct slideover opens
- [ ] 5.4.4 Update to use navigateTo if needed

## Phase 6: Testing & Polish

### 6.1 Test pre-session step

- [ ] 6.1.1 Test EVA input and validation
- [ ] 6.1.2 Test "Évaluation Non nécessaire" toggle
- [ ] 6.1.3 Test start button enable/disable logic
- [ ] 6.1.4 Test navigation to active session
- [ ] 6.1.5 Test auto-save of EVA value

### 6.2 Test active session step

- [ ] 6.2.1 Test timer start/stop functionality
- [ ] 6.2.2 Test pause/resume functionality
- [ ] 6.2.3 Test extend session functionality
- [ ] 6.2.4 Test 5-minute warning
- [ ] 6.2.5 Test notes auto-save
- [ ] 6.2.6 Test tags auto-save
- [ ] 6.2.7 Test previous notes expansion
- [ ] 6.2.8 Test stop action and confirmation
- [ ] 6.2.9 Test navigation to post-session

### 6.3 Test post-session step

- [ ] 6.3.1 Test final EVA input
- [ ] 6.3.2 Test pain differential calculation
- [ ] 6.3.3 Test differential color display (green/red/gray)
- [ ] 6.3.4 Test notes read-only display
- [ ] 6.3.5 Test tags read-only display
- [ ] 6.3.6 Test finalize action
- [ ] 6.3.7 Test navigation to summary

### 6.4 Test summary step

- [ ] 6.4.1 Test analytics chart display
- [ ] 6.4.2 Test chart tooltip functionality
- [ ] 6.4.3 Test billing section display
- [ ] 6.4.4 Test "Marquer comme payé" action
- [ ] 6.4.5 Test next appointment booking
- [ ] 6.4.6 Test navigation to dashboard
- [ ] 6.4.7 Test navigation to patient file

### 6.5 Test URL navigation

- [ ] 6.5.1 Test browser back button
- [ ] 6.5.2 Test browser forward button
- [ ] 6.5.3 Test direct URL navigation to each step
- [ ] 6.5.4 Test page refresh during active session
- [ ] 6.5.5 Test tab closure and reopening
- [ ] 6.5.6 Test bookmarking and reopening

### 6.6 Test error handling

- [ ] 6.6.1 Test missing consultation (404)
- [ ] 6.6.2 Test missing patient
- [ ] 6.6.3 Test network error during auto-save
- [ ] 6.6.4 Test timer sync failure
- [ ] 6.6.5 Test step navigation validation

### 6.7 Test responsive design

- [ ] 6.7.1 Test on desktop (>1024px)
- [ ] 6.7.2 Test on tablet (768-1024px)
- [ ] 6.7.3 Test on mobile (<768px)
- [ ] 6.7.4 Test patient info collapse
- [ ] 6.7.5 Test chart scrolling on mobile

### 6.8 Test accessibility

- [ ] 6.8.1 Test keyboard navigation
- [ ] 6.8.2 Test screen reader announcements
- [ ] 6.8.3 Test color contrast
- [ ] 6.8.4 Test focus management

### 6.9 Test integration points

- [ ] 6.9.1 Test navigation from therapist day page
- [ ] 6.9.2 Test navigation from planning slideover
- [ ] 6.9.3 Test navigation from patient sessions tab
- [ ] 6.9.4 Test return to dashboard
- [ ] 6.9.5 Test return to patient file

### 6.10 Performance testing

- [ ] 6.10.1 Test page load time
- [ ] 6.10.2 Test chart rendering performance
- [ ] 6.10.3 Test auto-save performance
- [ ] 6.10.4 Test memory usage during long sessions

## Phase 7: Documentation & Cleanup

### 7.1 Update documentation

- [ ] 7.1.1 Update component documentation for new page
- [ ] 7.1.2 Document step state management
- [ ] 7.1.3 Document URL query parameters
- [ ] 7.1.4 Document auto-save mechanism
- [ ] 7.1.5 Update openspec changelog

### 7.2 Code cleanup

- [ ] 7.2.1 Remove unused overlay code (if any)
- [ ] 7.2.2 Remove unused imports
- [ ] 7.2.3 Add TypeScript types for new components
- [ ] 7.2.4 Format code with Prettier
- [ ] 7.2.5 Run linter and fix warnings

### 7.3 Optional: Keep slideover for read-only

- [ ] 7.3.1 Decide if ActiveConsultationSlideover should be kept
- [ ] 7.3.2 If kept, modify to be read-only only
- [ ] 7.3.3 Add "Quick View" button to summary step
- [ ] 7.3.4 Test read-only slideover

## Notes

- Total estimated time: 2-3 days
- Prioritize Phase 1-4 for MVP
- Phase 5-6 are critical for user testing
- Phase 7 can be done after initial deployment
- Keep all existing functionality while migrating
- Test thoroughly before removing old slideover code
