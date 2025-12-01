# Optimize Treatment Plan File Upload - Tasks

## Implementation Tasks

- [x] **Update UploadedFile Interface**
  - [x] Remove `status`, `progress`, and `documentId` properties
  - [x] Add `stagedAt` timestamp for tracking
  - [x] Keep `file`, `title`, and `type` properties

- [x] **Modify handleFileSelect Function**
  - [x] Remove immediate upload call
  - [x] Only add files to `uploadedFiles` array
  - [x] Set default metadata values
  - [x] Update UI to show staged state

- [x] **Update handleSubmit Function**
  - [x] Add batch upload logic before creating treatment plan
  - [x] Upload all staged files sequentially
  - [x] Handle upload failures gracefully
  - [x] Create document records after successful uploads
  - [x] Link documents to treatment plan

- [x] **Update File Display UI**
  - [x] Remove progress bars and upload status indicators
  - [x] Show staged files with edit capabilities
  - [x] Add file size and type information
  - [x] Update remove functionality

- [x] **Error Handling**
  - [x] Handle individual file upload failures
  - [x] Allow partial success scenarios
  - [x] Provide clear error messages
  - [x] Implement proper user feedback

- [x] **Testing and Validation**
  - [x] Validate component syntax and imports
  - [x] Verify form submission logic
  - [x] Test error handling scenarios
  - [x] Confirm UI updates work correctly

## Dependencies

- None - this is a self-contained optimization

## Validation Criteria

- Files are staged immediately without upload
- All files upload during form submission
- Progress feedback works during batch upload
- Error handling is robust
- UI remains responsive during upload process
