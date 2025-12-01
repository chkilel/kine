# Display Planned Consultations in Treatment Plan Tab

## Summary

This change will display planned consultations in the "Aperçu des séances" section of the treatment plan tab, reusing existing composables and following Nuxt best practices.

## Problem

Currently, the "Aperçu des séances" (Sessions Overview) section in the treatment plan tab shows an empty table with no data, even when consultations have been planned through the consultation planning system. Users cannot see the planned sessions without opening the planning slideover.

## Solution

Enhance the PatientTreatmentPlanTab component to:

1. Fetch and display planned consultations for the active treatment plan
2. Reuse the existing `useConsultations` composable and `fetchTreatmentPlanConsultations` method
3. Display consultations in a table format similar to the planning slideover
4. Use existing Nuxt UI components and styling patterns

## Technical Approach

- Leverage the existing `/api/treatment-plans/[id]/consultations` endpoint
- Use the `useConsultations` composable's `fetchTreatmentPlanConsultations` method
- Display data using the existing `UTable` component with proper columns
- Follow existing patterns for status badges and action buttons
- Maintain consistency with the consultation planning slideover table

## Benefits

- Users can quickly see planned consultations without opening the planning interface
- Improves visibility of treatment plan progress
- Reuses existing code and API endpoints
- Maintains consistent UI patterns across the application
