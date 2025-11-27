# Optimize Treatment Plan File Upload

## Problem Statement

The current file upload process in the treatment plan creation (`TreatmentPlanCreateSideover.vue`) is inefficient. Files are uploaded immediately when selected, which can lead to:

1. Poor user experience when uploading multiple large files
2. Unnecessary network requests if the user cancels the form
3. Wasted storage space for abandoned treatment plans
4. No ability to modify file metadata before upload

## Proposed Solution

Implement a deferred upload approach where files are staged locally and only uploaded when the treatment plan form is submitted. This will:

1. Store files in a local array with metadata without immediate upload
2. Allow users to review and modify file information before final upload
3. Batch upload all files during form submission
4. Provide better progress feedback during the final submission process

## Benefits

- **Improved UX**: Faster file selection, no immediate upload delays
- **Resource Efficiency**: No wasted uploads for abandoned forms
- **Better Control**: Users can modify metadata before final upload
- **Cleaner Code**: Separation of file staging from upload logic

## Technical Approach

1. Modify `UploadedFile` interface to remove upload-specific properties
2. Update `handleFileSelect` to only stage files locally
3. Move upload logic to `handleSubmit` function
4. Update UI to reflect staged vs uploaded states
5. Implement batch upload with proper error handling
