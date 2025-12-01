# Document Edit and Delete Specification

## ADDED Requirements

### Requirement: Inline Document Editing

The system SHALL provide inline editing capabilities for document metadata (title, category, description) in the treatment plan view.

As a therapist, I want to edit document metadata (title, category, description) directly in the treatment plan view so that I can correct mistakes or update information without leaving the patient context.

#### Scenario:

When viewing documents in the treatment plan tab, the user clicks the edit button on a document, modifies the metadata inline, and saves the changes.

**Acceptance Criteria:**

- The system SHALL provide an edit button for each document that enters edit mode when clicked
- The system SHALL make document title, category, and description fields editable inline during edit mode
- The system SHALL use the existing document category dropdown for category selection
- The system SHALL display Save and Cancel buttons during edit mode
- The system SHALL persist changes via API call to PUT /api/patients/[id]/documents/[docId]
- The system SHALL display a success toast notification on successful update
- The system SHALL provide appropriate error feedback for failed updates
- The system SHALL cancel edit mode if user navigates away or clicks Cancel

### Requirement: Document Deletion with Confirmation

The system SHALL provide document deletion functionality with confirmation dialogs.

As a therapist, I want to delete documents that are no longer relevant so that I can maintain an organized and accurate document record for the patient.

#### Scenario:

When viewing documents, the user clicks the delete button, confirms the deletion in the modal, and the document is removed from the list.

**Acceptance Criteria:**

- The system SHALL provide a delete button (trash icon) for each document
- The system SHALL trigger a confirmation modal when delete button is clicked
- The system SHALL display the document name and confirmation prompt in the modal
- The system SHALL allow the user to confirm or cancel the deletion
- The system SHALL trigger API call to DELETE /api/patients/[id]/documents/[docId] when confirmed
- The system SHALL immediately remove the document from the UI (optimistic update)
- The system SHALL display a success toast notification on successful deletion
- The system SHALL handle errors with rollback if deletion fails
- The system SHALL show loading state during deletion process

### Requirement: Edit Mode State Management

The system SHALL provide clear visual feedback about the current editing state.

As a user, I want clear visual feedback about the current editing state so that I understand what actions are available at any time.

#### Scenario:

The user enters edit mode on a document, and the interface clearly shows which document is being edited and what actions are available.

**Acceptance Criteria:**

- The system SHALL ensure only one document can be in edit mode at a time
- The system SHALL hide the edit button when document is in edit mode
- The system SHALL disable other document actions during edit mode
- The system SHALL provide visual indicators showing which document is being edited
- The system SHALL cancel edit mode when Escape key is pressed
- The system SHALL NOT cancel editing when clicking outside edit area (explicit action required)

### Requirement: API Integration for Document Updates

The system SHALL provide proper API endpoints to handle document updates and deletions.

As the system, I need proper API endpoints to handle document updates and deletions so that the frontend can reliably manage document data.

#### Scenario:

When the user saves document changes or confirms deletion, the frontend makes appropriate API calls to update the backend data.

**Acceptance Criteria:**

- The system SHALL provide PUT /api/patients/[id]/documents/[docId] endpoint that updates document metadata
- The system SHALL provide DELETE /api/patients/[id]/documents/[docId] endpoint that soft-deletes documents
- The system SHALL implement proper validation of input data on server side
- The system SHALL perform authorization checks to ensure user can modify the document
- The system SHALL maintain organization-based data isolation
- The system SHALL return proper HTTP status codes and error responses
- The system SHALL invalidate query cache after successful operations

## MODIFIED Requirements

### Requirement: Document Display Interface

The system SHALL display all available actions for each document in the interface.

As a therapist viewing patient documents, I want to see all available actions for each document so that I can perform the necessary operations.

#### Scenario:

When viewing the document list, each document row shows appropriate action buttons for viewing, downloading, editing, and deleting.

**Modified Acceptance Criteria:**

- The system SHALL display view, download, edit, and delete buttons in each document row
- The system SHALL enter inline edit mode for document metadata when edit button is clicked
- The system SHALL trigger confirmation modal when delete button is clicked
- The system SHALL change button states appropriately during edit/delete operations
- The system SHALL maintain consistent button styling with existing UI patterns
- The system SHALL maintain proper spacing and visual hierarchy

### Requirement: Error Handling and User Feedback

The system SHALL provide clear feedback about document operation success or failure.

As a user performing document operations, I want clear feedback about success or failure so that I understand the result of my actions.

#### Scenario:

During edit or delete operations, the user receives appropriate feedback about the operation status through loading states, success messages, or error notifications.

**Modified Acceptance Criteria:**

- The system SHALL provide success notifications for edit and delete operations
- The system SHALL display error messages for failed operations with actionable information
- The system SHALL show loading states during API calls
- The system SHALL display validation errors inline for edit operations
- The system SHALL handle network errors with retry options
- The system SHALL maintain consistent toast notification styling and positioning
