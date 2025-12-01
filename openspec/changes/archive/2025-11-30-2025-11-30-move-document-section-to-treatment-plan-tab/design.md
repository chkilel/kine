# Design Document: Document Section Migration

## Architecture Overview

This design outlines the migration of document management functionality from `TreatmentPlanCreateSideover` to `PatientTreatmentPlanTab` while maintaining the same inline editing approach and user experience.

## Current State Analysis

### Source Component (TreatmentPlanCreateSideover)

- **Location**: Lines 460-586 contain the complete document management section
- **Features**: File upload, staging, metadata editing, existing document display
- **Dependencies**: Upload composable, form state, treatment plan context
- **UI Pattern**: Card-based layout with inline editing capabilities

### Target Component (PatientTreatmentPlanTab)

- **Current Document Section**: Lines 441-482 (basic placeholder implementation)
- **Context**: Already has treatment plan data and active plan context
- **Layout**: Grid layout with left/right columns, documents in right column

## Migration Strategy

### 1. Code Extraction and Adaptation

#### Extracted Elements:

- File upload UI and logic (lines 464-486)
- Staged files management (lines 488-532)
- Existing documents display (lines 534-573)
- Document metadata editing (lines 515-530)

#### Required Adaptations:

- Remove form submission integration (documents handled independently)
- Adapt to treatment plan tab context (no form state)
- Integrate with existing treatment plan data
- Update error handling for standalone operation

### 2. State Management

#### New Reactive State:

```typescript
// Document management state
const uploadedFiles = ref<UploadedFile[]>([])
const fileInputRef = ref<HTMLInputElement>()
const documents = ref<any[]>([]) // Existing documents for active plan
const loading = ref(false)
```

#### Data Flow:

1. Load existing documents for active treatment plan
2. Handle new file uploads independently
3. Link uploaded documents to treatment plan via API
4. Refresh document list after operations

### 3. API Integration

#### Required API Calls:

- `GET /api/patients/[id]/documents?treatmentPlanId=[planId]` - Fetch existing documents
- `POST /api/patients/[id]/documents` - Create document records
- `PUT /api/patients/[id]/documents/[docId]` - Link to treatment plan
- Existing upload endpoints for file storage

#### Error Handling:

- Individual file upload failures
- Document linking errors
- Network issues with proper user feedback

### 4. UI Integration

#### Layout Considerations:

- Maintain existing card structure in right column
- Preserve responsive design patterns
- Keep consistent spacing and styling
- Ensure proper integration with existing content

#### Component Structure:

```vue
<UCard>
  <div class="mb-5 flex items-center justify-between">
    <h3 class="text-base font-bold">Documents du plan de traitement</h3>
    <UButton icon="i-lucide-plus" color="primary" size="sm">Ajouter un document</UButton>
  </div>
  
  <!-- Document upload and management content -->
  <div class="space-y-4">
    <!-- Upload section -->
    <!-- Staged files -->
    <!-- Existing documents -->
  </div>
</UCard>
```

## Implementation Details

### 1. File Upload Logic

- Preserve existing file handling from TreatmentPlanCreateSideover
- Maintain staged file approach with metadata editing
- Use existing upload composable and R2 integration

### 2. Document Display

- Show existing documents linked to active treatment plan
- Maintain file icon, metadata, and action buttons
- Preserve view, download, delete functionality

### 3. Metadata Editing

- Keep inline editing for document titles and categories
- Use same form field patterns and validation
- Maintain DOCUMENT_CATEGORY_OPTIONS integration

### 4. Error Handling and Feedback

- Preserve toast notifications for success/error states
- Maintain loading indicators during operations
- Handle individual file failures gracefully

## Risk Mitigation

### Technical Risks:

- **Context Loss**: Documents lose treatment plan context during migration
  - _Mitigation_: Explicit treatment plan ID in all API calls
- **State Conflicts**: Document state conflicts with existing component state
  - _Mitigation_: Isolated reactive state for document management
- **API Integration**: Breaking existing document workflows
  - _Mitigation_: Preserve existing API endpoints and patterns

### UX Risks:

- **Feature Loss**: Missing functionality during migration
  - _Mitigation_: Comprehensive testing of all document operations
- **Layout Issues**: Responsive design problems
  - _Mitigation_: Maintain existing card structure and test breakpoints

## Success Criteria

1. **Functional Parity**: All document management features work identically
2. **Seamless Integration**: Documents section fits naturally in treatment plan tab
3. **Performance**: No degradation in upload or display performance
4. **User Experience**: Intuitive workflow within treatment plan context
5. **Error Handling**: Robust error handling and user feedback

## Testing Strategy

### Manual Testing:

- File upload with various formats and sizes
- Document metadata editing and validation
- Existing document display and actions
- Error scenarios (network failures, invalid files)
- Responsive design across breakpoints

### Integration Testing:

- Document linking to treatment plans
- API endpoint compatibility
- State management consistency
- Error propagation and user feedback
