## 1. Create Active Consultation Slideover Component

- [ ] 1.1 Create `app/components/consultation/ActiveConsultationSlideover.vue` with USlideover fullscreen container
- [ ] 1.2 Define component props interface (consultation, patient, treatmentPlan, previousConsultations)
- [ ] 1.3 Define component emits (close, complete, pause, stop)
- [ ] 1.4 Set up basic three-column layout using Tailwind grid

## 2. Implement Patient Sidebar

- [ ] 2.1 Create `PatientProfileCard.vue` with avatar, name, age, gender
- [ ] 2.2 Create `DiagnosisCard.vue` displaying main diagnosis and stage
- [ ] 2.3 Create `MedicalAlertCard.vue` showing allergies/warnings with UAlert (error color)
- [ ] 2.4 Create `ProgressStatsCard.vue` with treatment progress, consultations count, last EVA
- [ ] 2.5 Integrate all cards into PatientSidebar section

## 3. Implement Pain Level (EVA) Input

- [ ] 3.1 Create pain level buttons (0-10) with appropriate colors and emojis
  - [ ] 0-3: Green/Lime colors, happy emojis
  - [ ] 4-7: Yellow/Orange colors, neutral/sad emojis
  - [ ] 8-10: Red colors, crying emoji
- [ ] 3.2 Add hover states and focus styling for accessibility
- [ ] 3.3 Bind selection to reactive state (painLevelBefore)
- [ ] 3.4 Add visual indicator for currently selected value

## 4. Implement Consultation Notes Editor

- [ ] 4.1 Create rich text notes area with UTextarea or similar
- [ ] 4.2 Add formatting toolbar (bold, italic, underline, lists)
- [ ] 4.3 Add auto-save indicator ("Sauvegardé") when notes change
- [ ] 4.4 Implement debounced auto-save to consultation.notes field

## 5. Implement Smart Tags System

- [ ] 5.1 Create predefined tag buttons (Douleur Diminuée, Gain Amplitude, Proprioception, etc.)
- [ ] 5.2 Add tag selection state management
- [ ] 5.3 Implement tag insertion into notes (prepend or append)
- [ ] 5.4 Add "Gérer les tags" button for future tag management

## 6. Implement Consultation Timer

- [ ] 6.1 Create countdown timer display (remaining time) with large green text
- [ ] 6.2 Add elapsed time display below main timer
- [ ] 6.3 Implement timer start/pause/reset logic
- [ ] 6.4 Calculate remaining time from consultation duration
- [ ] 6.5 Add visual "remaining" label with uppercase styling

## 7. Implement Consultation Controls

- [ ] 7.1 Create pause button with circular UButton and pause icon
- [ ] 7.2 Create stop button with circular UButton (error color) and stop icon
- [ ] 7.3 Add hover scale animation to buttons
- [ ] 7.4 Wire up pause/stop to emit events

## 8. Implement Previous Consultation Notes

- [ ] 8.1 Create collapsible section using UAccordion or UCollapsible
- [ ] 8.2 Display most recent consultation summary (date, location, preview)
- [ ] 8.3 Expand to show full details: treatment applied, assessment, next steps
- [ ] 8.4 Use appropriate styling (red accents for treatment, blue for next steps)

## 9. Implement Complete Consultation Action

- [ ] 9.1 Create prominent "Terminer la séance" button at bottom of controls
- [ ] 9.2 Add check_circle icon
- [ ] 9.3 Use primary color for button
- [ ] 9.4 Wire up to emit 'complete' event with consultation data

## 10. Integrate with Therapist Day Page

- [ ] 10.1 Import ActiveConsultationSlideover in `app/pages/therapists/day.vue`
- [ ] 10.2 Modify handleStartConsultation to open slideover instead of just updating status
- [ ] 10.3 Fetch patient data and previous consultations before opening
- [ ] 10.4 Handle slideover close events
- [ ] 10.5 Handle slideover complete events (save data and update status)

## 11. Integrate with Consultation Planning Slideover

- [ ] 11.1 Import ActiveConsultationSlideover in `app/components/consultation/PlanningSlideover.vue`
- [ ] 11.2 Modify handleStartConsultation to open slideover instead of confirmation modal
- [ ] 11.3 Handle slideover events similarly to therapist day page

## 12. Create Consultation Timer Composable

- [ ] 12.1 Create `app/composables/useConsultationTimer.ts` (if needed)
- [ ] 12.2 Implement timer logic (start, pause, reset, getElapsed, getRemaining)
- [ ] 12.3 Handle consultation duration from startTime/endTime
- [ ] 12.4 Clear timer on component unmount

## 13. Update Data Models and Types

- [ ] 13.1 Review consultation types for all required fields (notes, painLevelBefore, painLevelAfter, etc.)
- [ ] 13.2 Ensure types match database schema
- [ ] 13.3 Add ConsultationData interface for slideover emit payload

## 14. Styling and Responsive Design

- [ ] 14.1 Apply Nuxt UI color scheme throughout (primary, success, error, neutral)
- [ ] 14.2 Implement responsive breakpoints for three-column layout
- [ ] 14.3 Add smooth transitions and hover effects
- [ ] 14.4 Ensure proper spacing using Tailwind utilities
- [ ] 14.5 Test dark mode compatibility

## 15. Accessibility and Keyboard Navigation

- [ ] 15.1 Add keyboard shortcuts for pain level (0-9 keys)
- [ ] 15.2 Add ARIA labels for all interactive elements
- [ ] 15.3 Implement proper focus management on slideover open/close
- [ ] 15.4 Ensure high contrast for color-coded elements

## 16. Testing and Validation

- [ ] 16.1 Test consultation start workflow from therapist day page
- [ ] 16.2 Test consultation start workflow from planning slideover
- [ ] 16.3 Test pain level selection and saving
- [ ] 16.4 Test notes editing and auto-save
- [ ] 16.5 Test consultation timer accuracy
- [ ] 16.6 Test pause/resume functionality
- [ ] 16.7 Test consultation completion with data persistence
- [ ] 16.8 Test previous consultation notes display
- [ ] 16.9 Test responsive layout on different screen sizes
- [ ] 16.10 Test dark mode styling
