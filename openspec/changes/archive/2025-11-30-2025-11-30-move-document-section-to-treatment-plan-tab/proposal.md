# Move Document Section to Treatment Plan Tab

## Summary

Move the document management functionality from the TreatmentPlanCreateSideover component to the PatientTreatmentPlanTab component to enable inline document editing within the treatment plan view. This change will improve user experience by allowing document management directly within the treatment plan context rather than only during creation/editing.

## Why

The current workflow forces users to open the treatment plan edit slideover solely to manage documents, creating unnecessary friction and breaking the natural workflow of viewing and managing treatment plan information. Users frequently need to add or update documents (like new imaging results, prescriptions, or treatment notes) while reviewing the active treatment plan, but must navigate away from the context to do so. This separation reduces efficiency and creates a disjointed user experience.

Moving document management to the treatment plan tab aligns with the principle of putting functionality where users expect it, following the pattern of other inline editing features in the application. It enables a more natural workflow where users can view treatment plan details and immediately manage related documents without context switching.

## Problem

Currently, document management is only available in the TreatmentPlanCreateSideover when creating or editing a treatment plan. Users cannot add, edit, or manage documents directly from the treatment plan view, creating a disjointed workflow where they must open the edit slideover just to manage documents.

## Solution

Extract the document section (lines 460-586) from TreatmentPlanCreateSideover.vue and integrate it into PatientTreatmentPlanTab.vue as a new inline document management section. The implementation will:

1. Preserve the existing document upload, staging, and management functionality
2. Adapt the code to work within the treatment plan tab context
3. Maintain the same UI patterns and user experience
4. Ensure proper integration with the existing treatment plan data

## Impact

- **Improved UX**: Users can manage documents directly within the treatment plan view
- **Streamlined workflow**: No need to open edit slideover just for document management
- **Better context**: Documents are managed where they're most relevant
- **Minimal risk**: Reusing proven document management code with minimal changes

## Dependencies

- Existing document upload infrastructure (R2 storage, signed URLs)
- Current document API endpoints
- Treatment plan data structure
- Nuxt UI components and patterns
