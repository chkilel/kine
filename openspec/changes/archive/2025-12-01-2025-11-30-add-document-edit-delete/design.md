# Design Document: Document Edit and Delete Functionality

## Architecture Overview

This enhancement extends the existing document management system in PatientTreatmentPlanTab.vue by adding inline editing and deletion capabilities while maintaining the current architecture patterns.

## Component Architecture

### Current Structure

```
PatientTreatmentPlanTab.vue
├── PatientTreatmentPlanDocuments.vue (child component)
├── useUploads composable (file operations)
├── Document API endpoints (/api/patients/[id]/documents)
└── Document database schema
```

### Enhanced Structure

```
PatientTreatmentPlanTab.vue
├── PatientTreatmentPlanDocuments.vue (enhanced with edit/delete)
├── DocumentEditModal.vue (new component for inline editing)
├── useDocuments composable (new for CRUD operations)
├── useUploads composable (existing file operations)
├── Document API endpoints (enhanced with PUT/DELETE)
└── Document database schema (unchanged)
```

## Data Flow

### Edit Flow

1. User clicks edit button on document
2. Document enters edit mode (inline state change)
3. User modifies metadata (title, category, description)
4. Save button triggers API call to PUT /api/patients/[id]/documents/[docId]
5. Component updates local state and shows success feedback

### Delete Flow

1. User clicks delete button on document
2. Confirmation modal appears
3. User confirms deletion
4. API call to DELETE /api/patients/[id]/documents/[docId]
5. Document removed from local state and UI updates

## State Management

### Component State

```typescript
// New state for edit mode
const editingDocumentId = ref<string | null>(null)
const editingDocument = ref<Document | null>(null)
const isDeleting = ref<string[]>([]) // Track deleting documents

// Existing state remains unchanged
const { documents, isLoading, error, refetch } = useQuery(...)
```

### API Integration

- Leverage existing useRequestFetch pattern
- Use useMutation for edit/delete operations
- Maintain query cache invalidation patterns

## UI/UX Considerations

### Inline Editing Pattern

- Click-to-edit on document title and description
- Dropdown for category selection
- Save/Cancel buttons appear during edit mode
- Loading states during API operations

### Deletion Pattern

- Trash icon with hover effects
- Confirmation modal following existing UModal patterns
- Soft delete with proper error handling
- Visual feedback during deletion process

### Consistency with Existing Patterns

- Use Nuxt UI components (UButton, UInput, USelectMenu, UModal)
- Follow existing color schemes and spacing
- Maintain French localization
- Use existing toast notification patterns

## Performance Considerations

### Optimistic Updates

- Update UI immediately for better perceived performance
- Rollback on API failure
- Maintain data consistency

### Caching Strategy

- Invalidate relevant query cache after mutations
- Use existing queryCache patterns
- Minimize unnecessary refetches

## Error Handling

### Edit Errors

- Validation errors displayed inline
- Network errors shown via toast notifications
- Graceful fallback to original data

### Delete Errors

- Prevent deletion if document is referenced elsewhere
- Clear error messages for permission issues
- Option to retry failed operations

## Security Considerations

### Authorization

- Verify user can edit/delete documents
- Check organization membership
- Validate document ownership

### Data Validation

- Server-side validation for all updates
- Sanitize user inputs
- Prevent malicious file metadata

## Implementation Phases

### Phase 1: API Enhancement

- Add PUT endpoint for document updates
- Add DELETE endpoint for document deletion
- Update validation schemas

### Phase 2: Component Enhancement

- Add edit mode state management
- Implement inline editing UI
- Add delete confirmation modal

### Phase 3: Integration

- Connect UI to API endpoints
- Add error handling and loading states
- Test user workflows

## Testing Strategy

### Manual Testing

- Edit document metadata successfully
- Cancel editing operation
- Delete document with confirmation
- Handle network errors gracefully
- Verify permissions work correctly

### Edge Cases

- Edit while document is being uploaded
- Delete document that doesn't exist
- Handle concurrent edits
- Large document metadata handling
