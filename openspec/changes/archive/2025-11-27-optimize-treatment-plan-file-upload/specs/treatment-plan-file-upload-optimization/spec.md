# treatment-plan-file-upload-optimization Specification

## ADDED Requirements

### Requirement: Stage Files Locally Before Upload

Files selected for treatment plan creation SHALL be staged locally in an array without immediate upload to storage.

#### Scenario: User selects multiple PDF files for a new treatment plan

- **WHEN** the user selects files through the file input in TreatmentPlanCreateSideover
- **THEN** the files SHALL be added to a local array without network requests
- **AND** the files SHALL be displayed in the UI with their metadata
- **AND** no upload progress indicators SHALL be shown during selection

### Requirement: Batch Upload During Form Submission

All staged files SHALL be uploaded to storage when the treatment plan form is submitted.

#### Scenario: User submits treatment plan form with staged files

- **WHEN** the user submits the treatment plan form with staged files
- **THEN** all staged files SHALL be uploaded to R2 storage sequentially
- **AND** document records SHALL be created in the database for each successful upload
- **AND** documents SHALL be linked to the newly created treatment plan
- **AND** the treatment plan SHALL be created successfully only after file processing

### Requirement: File Metadata Management

Users SHALL be able to modify file metadata (title, type) before final upload.

#### Scenario: User wants to modify file information before submission

- **GIVEN** the user has staged files in the treatment plan form
- **WHEN** they edit the title or type of a staged file
- **THEN** the metadata SHALL be updated in the local array
- **AND** the changes SHALL be preserved until form submission
- **AND** the updated metadata SHALL be used when creating document records

### Requirement: Progress Feedback During Batch Upload

Users SHALL see progress feedback when files are being uploaded during form submission.

#### Scenario: Files are being uploaded during form submission

- **GIVEN** the form is being submitted with staged files
- **WHEN** the upload process starts
- **THEN** the submit button SHALL show loading state with progress indication
- **AND** progress SHALL be displayed for individual file uploads
- **AND** users SHALL be informed of any upload failures with specific error messages

### Requirement: Error Handling for Failed Uploads

The system SHALL handle individual file upload failures gracefully without failing the entire treatment plan creation.

#### Scenario: One file fails to upload during batch upload

- **GIVEN** multiple files are being uploaded during form submission
- **WHEN** one file upload fails
- **THEN** the error SHALL be logged and displayed to the user
- **AND** other files SHALL continue uploading
- **AND** the treatment plan SHALL still be created with successfully uploaded files
- **AND** the user SHALL be informed about the failed file(s) with retry options
