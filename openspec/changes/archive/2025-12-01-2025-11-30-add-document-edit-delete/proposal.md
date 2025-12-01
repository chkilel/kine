# Add Document Edit and Delete Functionality

## Summary

Add inline editing and deletion capabilities for documents in the PatientTreatmentPlanTab.vue component to improve document management workflow.

## Why

The current document management system only allows uploading and viewing documents, but lacks the ability to modify document metadata or remove documents after upload. This creates friction in the clinical workflow where therapists frequently need to correct document titles, update categories, or remove outdated documents. The inability to perform these basic operations forces users to either live with incorrect information or engage in complex workarounds that disrupt their workflow and reduce data quality.

## Problem Statement

Currently, the PatientTreatmentPlanTab.vue displays documents through the PatientTreatmentPlanDocuments component, but users cannot edit document metadata (title, category, description) or delete documents after upload. This limits the flexibility of document management and requires workarounds for simple corrections.

## Proposed Solution

Enhance the document management interface by:

1. Adding inline editing capabilities for document metadata (title, category, description)
2. Implementing delete functionality with confirmation dialogs
3. Maintaining the existing upload and view/download functionality
4. Ensuring proper error handling and user feedback

## Scope

### In Scope

- Inline editing of document title, category, and description
- Delete functionality with confirmation
- Proper API integration for update/delete operations
- Loading states and error handling
- Consistent UI patterns with existing components

### Out of Scope

- Document file replacement (would require new upload)
- Bulk operations on multiple documents
- Document versioning
- Advanced document permissions

## Success Criteria

1. Users can edit document metadata inline without leaving the patient treatment plan view
2. Users can delete documents with appropriate confirmation
3. All operations provide clear feedback and handle errors gracefully
4. The interface remains consistent with existing UI patterns
5. Performance is maintained with proper loading states

## Dependencies

- Existing document API endpoints for update/delete operations
- Current document management components and composables
- Nuxt UI component library for consistent UI patterns
