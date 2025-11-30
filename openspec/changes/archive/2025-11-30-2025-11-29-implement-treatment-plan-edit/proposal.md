# Implement Treatment Plan Edit Functionality

## Summary

Add the ability to edit existing treatment plans by reusing and enhancing the existing create slideover component and composable, with proper API endpoints and integration with existing constants.

## Problem Statement

Currently, users can create treatment plans but cannot edit them after creation. This limits the ability to update treatment plans as patient conditions change, prescriptions are modified, or treatment goals evolve.

## Proposed Solution

1. **Enhance TreatmentPlanCreateSideover.vue** - Make it reusable for both create and edit modes
2. **Update useTreatmentPlans.ts composable** - Add update functionality
3. **Create PUT API endpoint** - Add `/api/patients/[id]/treatment-plans/[planId]` endpoint
4. **Integrate with constants** - Use existing status, coverage, and other configuration constants
5. **Add edit trigger** - Add edit button to treatment plan display components

## Key Features

- Edit all treatment plan fields (title, diagnosis, objectives, dates, status, etc.)
- Maintain existing document upload/management functionality
- Use existing validation schemas and constants
- Preserve current UI/UX patterns
- Support both create and edit modes in a single component

## Technical Approach

- Convert `TreatmentPlanCreateSideover.vue` to a generic `TreatmentPlanFormSlideover.vue`
- Add optional `treatmentPlan` prop to distinguish between create/edit modes
- Add `updateTreatmentPlan` function to `useTreatmentPlans.ts` composable
- Create PUT endpoint following existing API patterns
- Leverage existing `TreatmentPlanUpdate` type and schema
- Use constants from `shared/utils/constants.ts` for all dropdowns and configurations

## Benefits

- Consistent user experience between create and edit workflows
- Reduced code duplication through component reuse
- Maintained type safety and validation
- Efficient use of existing infrastructure and patterns
