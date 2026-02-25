## 1. Add Session Timing Display Section

- [x] 1.1 Create computed properties for timing data in TreatmentSessionSlideover
- [x] 1.2 Add timing information card to the slideover template
- [x] 1.3 Style timing display with Nuxt UI components
- [x] 1.4 Test timing display for all session states (not started, in progress, completed)

## 2. Format and Display Time Values

- [x] 2.1 Format appointment date using formatFrenchDate
- [x] 2.2 Format appointment times using formatTimeString
- [x] 2.3 Calculate and display planned vs actual duration comparison
- [x] 2.4 Display total paused time when applicable

## 3. Validate Implementation

- [x] 3.1 Test display when session not started (show appointment times only)
- [x] 3.2 Test display during active session (show actual start time, paused time if applicable)
- [x] 3.3 Test display for completed sessions (show all timing information)
- [x] 3.4 Verify time formatting matches existing patterns in the application
- [x] 3.5 Test with extended duration sessions
- [x] 3.6 Test with sessions that had multiple pauses

## 4. Extract to Separate Component

- [x] 4.1 Create TreatmentSessionTimingCard.vue component
- [x] 4.2 Create TreatmentSessionTimingCard.types.ts for type definitions
- [x] 4.3 Extract all timing card logic to new component
- [x] 4.4 Update TreatmentSessionSlideover to use new component
