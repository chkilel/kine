# Treatment Plan Edit Implementation Tasks

## Backend Tasks

- [x] 1. **Create PUT API endpoint for treatment plans**
  - [x] Create `/server/api/patients/[id]/treatment-plans/[planId].put.ts`
  - [x] Implement proper validation using `treatmentPlanUpdateSchema`
  - [x] Add authorization and organization checks
  - [x] Handle partial updates correctly
  - [x] Return updated treatment plan data

## Frontend Tasks

- [x] 2. **Enhance useTreatmentPlans.ts composable**
  - [x] Add `updateTreatmentPlan` function
  - [x] Include proper error handling and loading states
  - [x] Add optimistic updates if needed
  - [x] Ensure proper cache invalidation

- [x] 3. **Convert TreatmentPlanCreateSideover to reusable component**
  - [x] Make existing component dual-purpose (kept original name)
  - [x] Add optional `treatmentPlan` prop for edit mode
  - [x] Update form initialization to handle both create and edit modes
  - [x] Modify submit handler to call appropriate API endpoint
  - [x] Update title and descriptions based on mode
  - [x] Ensure all existing functionality (file upload, etc.) works in edit mode

- [x] 4. **Add edit trigger to treatment plan displays**
  - [x] Add edit button to treatment plan list/overview components
  - [x] Integrate with existing treatment plan display patterns
  - [x] Ensure proper state management for edit mode

- [x] 5. **Update constants usage**
  - [x] Verify all dropdowns use constants from `shared/utils/constants.ts`
  - [x] Ensure consistency across create and edit modes
  - [x] Add proper import for constants

## Integration Tasks

- [x] 6. **Update patient treatment plan tab**
  - [x] Add edit functionality to treatment plan tab in patient view
  - [x] Ensure proper data refresh after updates
  - [x] Handle loading and error states appropriately

- [x] 7. **Test and validate**
  - [x] Test edit functionality with various field combinations
  - [x] Verify file upload still works in edit mode
  - [x] Test validation and error handling
  - [x] Ensure proper data persistence and UI updates
  - [x] Build project successfully

## Documentation Tasks

- [x] 8. **Update component documentation**
  - [x] Document new props and usage patterns
  - [x] Update tasks.md with completion status
