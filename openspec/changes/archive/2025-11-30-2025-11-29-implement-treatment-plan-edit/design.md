# Treatment Plan Edit Design

## Architecture Overview

The treatment plan edit functionality will be implemented by extending the existing create workflow rather than creating a separate edit system. This approach ensures consistency and reduces code duplication.

## Component Design

### TreatmentPlanFormSlideover (Enhanced from TreatmentPlanCreateSideover)

**Props:**

```typescript
interface Props {
  patient: Patient
  treatmentPlan?: TreatmentPlan // Optional - if provided, edit mode
}
```

**Mode Detection:**

- Create mode: `treatmentPlan` prop is undefined
- Edit mode: `treatmentPlan` prop is provided

**Form Initialization:**

- Create mode: Use default values (current behavior)
- Edit mode: Populate form with existing treatment plan data

**Submit Logic:**

- Create mode: POST to `/api/patients/[id]/treatment-plans`
- Edit mode: PUT to `/api/patients/[id]/treatment-plans/[planId]`

## API Design

### PUT /api/patients/[id]/treatment-plans/[planId]

**Request Body:** `TreatmentPlanUpdate` (partial schema)
**Response:** Updated `TreatmentPlan` object

**Validation:**

- Use existing `treatmentPlanUpdateSchema` (partial of create schema)
- Maintain organization and patient ownership checks
- Preserve existing error handling patterns

## Composable Enhancement

### useTreatmentPlans.ts Additions

use pinia-colad mutation for the update

## Constants Integration

All form dropdowns and configurations will use existing constants:

- `TREATMENT_PLAN_STATUS_OPTIONS` for status selection
- `INSURANCE_COVERAGE_OPTIONS` for coverage status
- `CONSULTATION_TYPE_OPTIONS` for session types
- `CONSULTATION_LOCATION_OPTIONS` for locations

## File Handling in Edit Mode

The existing file upload functionality will be preserved:

- New files can be uploaded during edit
- Existing documents remain associated with the treatment plan
- Document linking logic remains the same

## State Management

- Form state uses reactive object (current pattern)
- Calendar models for date handling (current pattern)
- Loading states for async operations
- Proper error handling with toast notifications

## Validation Strategy

- Client-side validation using existing Zod schemas
- Server-side validation in API endpoint
- Partial updates supported through `treatmentPlanUpdateSchema`
- Maintain existing validation error patterns

## UI/UX Considerations

- Slideover title changes based on mode ("Créer" vs "Modifier")
- Submit button text adapts to mode
- Form pre-population in edit mode
- Consistent styling and layout with existing patterns
- Proper loading and error state handling
