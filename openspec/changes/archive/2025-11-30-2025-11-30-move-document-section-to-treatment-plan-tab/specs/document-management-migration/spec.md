# document-management-migration Specification

## Purpose

Migrate document management functionality from TreatmentPlanCreateSideover to PatientTreatmentPlanTab to enable inline document editing within the treatment plan view.

## ADDED Requirements

### Requirement: Document Upload Interface Migration

The system SHALL migrate the document upload interface from TreatmentPlanCreateSideover to PatientTreatmentPlanTab while preserving all existing functionality.

#### Scenario: File upload interface display

- **WHEN** viewing the treatment plan tab
- **THEN** the system SHALL display the document upload interface in the Documents card
- **AND** maintain the drag-and-drop functionality
- **AND** preserve the file input handling
- **AND** keep the same visual styling and layout

#### Scenario: File selection and staging

- **WHEN** users select files through the upload interface
- **THEN** the system SHALL stage files for upload with metadata editing
- **AND** display file information (name, size, type)
- **AND** allow inline editing of document title and category
- **AND** provide file removal functionality

### Requirement: Document Metadata Editing

The system SHALL provide inline document metadata editing within the treatment plan tab context.

#### Scenario: Document metadata form display

- **WHEN** files are staged for upload
- **THEN** the system SHALL display metadata editing forms for each file
- **AND** include title input field with placeholder text
- **AND** include document type selection dropdown
- **AND** use DOCUMENT_CATEGORY_OPTIONS for type selection
- **AND** maintain form validation and styling

#### Scenario: Metadata validation and submission

- **WHEN** users edit document metadata
- **THEN** the system SHALL validate required fields
- **AND** preserve metadata changes during the upload process
- **AND** associate metadata with uploaded documents
- **AND** handle validation errors gracefully

### Requirement: Existing Documents Display

The system SHALL display existing documents linked to the active treatment plan in the treatment plan tab.

#### Scenario: Document list display

- **WHEN** viewing the treatment plan tab with an active plan
- **THEN** the system SHALL fetch and display existing documents
- **AND** show document icons based on category
- **AND** display document metadata (name, upload date, uploader)
- **AND** provide action buttons (view, download, delete)

#### Scenario: Document actions and interactions

- **WHEN** users interact with existing documents
- **THEN** the system SHALL provide view functionality
- **AND** provide download functionality
- **AND** provide delete functionality with confirmation
- **AND** handle document operations independently of treatment plan editing

### Requirement: Document API Integration

The system SHALL integrate document management APIs within the treatment plan tab context.

#### Scenario: Document fetching

- **WHEN** the treatment plan tab loads with an active plan
- **THEN** the system SHALL fetch documents linked to the treatment plan
- **AND** use the patient ID and treatment plan ID for filtering
- **AND** handle API errors with appropriate user feedback
- **AND** display loading states during document fetching

#### Scenario: Document upload and linking

- **WHEN** users upload new documents
- **THEN** the system SHALL upload files to R2 storage
- **AND** create document records in the database
- **AND** link documents to the active treatment plan
- **AND** refresh the document list after successful upload

## MODIFIED Requirements

### Requirement: Treatment Plan Tab Layout

The system SHALL modify the treatment plan tab layout to accommodate the enhanced document management section.

#### Scenario: Document section integration

- **WHEN** displaying the treatment plan tab
- **THEN** the system SHALL integrate the document management section in the right column
- **AND** maintain responsive grid layout (3-column grid)
- **AND** preserve existing card styling and spacing
- **AND** ensure proper visual hierarchy with other sections

#### Scenario: Layout responsiveness

- **WHEN** viewing on different screen sizes
- **THEN** the system SHALL maintain responsive behavior
- **AND** adapt document section layout for mobile devices
- **AND** preserve usability across all breakpoints
- **AND** maintain consistent spacing and alignment

## ADDED Requirements

### Requirement: Error Handling and User Feedback

The system SHALL provide comprehensive error handling and user feedback for document operations.

#### Scenario: Upload error handling

- **WHEN** document upload fails
- **THEN** the system SHALL display specific error messages
- **AND** allow retry of failed uploads
- **AND** preserve successfully uploaded documents
- **AND** maintain application stability during errors

#### Scenario: Success feedback

- **WHEN** document operations complete successfully
- **THEN** the system SHALL display success notifications
- **AND** refresh the document list automatically
- **AND** provide clear confirmation of completed actions
- **AND** maintain consistent toast notification patterns

### Requirement: State Management Integration

The system SHALL integrate document state management within the treatment plan tab context.

#### Scenario: Document state initialization

- **WHEN** the treatment plan tab component mounts
- **THEN** the system SHALL initialize document management state
- **AND** set up reactive references for uploaded files
- **AND** configure loading and error states
- **AND** establish document data fetching

#### Scenario: State synchronization

- **WHEN** document operations occur
- **THEN** the system SHALL update component state appropriately
- **AND** synchronize document list with backend changes
- **AND** maintain consistency between UI and data
- **AND** handle concurrent operations gracefully
