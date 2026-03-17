# Implementation Tasks

## 1. Database Schema Updates

- [x] 1.1 Add `cost` integer field to `treatment_sessions` table (nullable, stores price in cents)
- [x] 1.2 Add `cost` to TypeScript types in shared/types/treatment-session.type.ts
- [x] 1.3 Update `treatmentSessionResponseSchema` to include cost field
- [x] 1.4 Create and run database migration for new column

## 2. Price Inheritance Logic

- [x] 2.1 Create `calculateInheritedPrice()` utility function
  - Takes: appointment (with location), treatmentPlan (optional), organization (with pricing)
  - Returns: price in cents based on inheritance chain
  - Logic: Check treatmentPlan.pricing[location] first, fallback to organization.pricing.sessionRates[location]
- [x] 2.2 Add unit tests for calculateInheritedPrice function

## 3. Backend API - Session Creation

- [x] 3.1 Update `server/api/treatment-sessions/index.post.ts` to fetch pricing data
  - Fetch organization data with pricing
  - Fetch treatment plan data if appointment has treatmentPlanId
- [x] 3.2 Calculate inherited price using calculateInheritedPrice utility
  - Store calculated price in session.cost field
- [x] 3.3 Return cost in response for client-side display

## 4. Backend API - Session Update

- [x] 4.1 Add `cost` field to updateClinicalNotesActionSchema
  - Allow cost to be updated
- [x] 4.2 Update `server/api/treatment-sessions/[id].patch.ts` to handle cost updates
  - Handle cost in updateClinicalNotes case
  - Validate that value is positive integer or null

## 5. Frontend - Price Display in Slideover

- [x] 5.1 Create `useInheritedPrice()` composable
  - Takes appointment, treatmentPlan, organization as parameters
  - Returns computed inherited price using calculateInheritedPrice
- [x] 5.2 Add price display section to TreatmentSessionSlideoverCenter.vue
  - Display inherited price before session creation (when no session exists)
  - Show price in human-readable format (e.g., "50,00 Dh")

## 6. Frontend - Price Modification

- [x] 6.1 Add price input field to TreatmentSessionSlideoverCenter.vue
  - Allow therapist to modify price
  - Show current price as default value
  - Include save button
- [x] 6.2 Wire up price save to existing updateClinicalNotes action
  - Call PATCH API with cost value
  - Show loading state during update
  - Display error if update fails

## 7. Session Start with Price Capture

- [x] 7.1 Update `handleStartSession()` in TreatmentSessionSlideover.vue
  - Capture current price (inherited or manual override)
  - Pass price when starting session if API supports it
- [x] 7.2 Ensure price is persisted when session transitions to "in_progress"
  - Either via start action or via separate update before start

## 8. Integration and Testing

- [x] 8.1 Test price display for plan-based sessions
  - Verify plan pricing is shown correctly
  - Test all location types (clinic, home, telehealth)
- [x] 8.2 Test price display for individual consultations
  - Verify organization default pricing is shown
  - Test when appointment has no treatment plan
- [x] 8.3 Test price override functionality
  - Verify override is saved correctly
  - Verify price can be modified at any session status
- [x] 8.4 Test price persistence through session lifecycle
  - Verify price is set when session is created
  - Verify price is preserved when session starts
  - Verify price updates work in pre_session, in_progress, finished, and completed statuses
- [x] 8.5 Manual end-to-end testing
  - Open session slideover → Verify price displays
  - Modify price and save → Verify update persists
  - Start session → Verify price is captured
  - Close and reopen → Verify price remains correct

## 9. Code Quality

- [x] 9.1 Run TypeScript type checking and resolve issues
- [x] 9.2 Run linter and fix style issues
- [x] 9.3 Add JSDoc comments to new utility functions
