## ADDED Requirements

### Requirement: EM-001 - Display Availability Exceptions

The system SHALL display availability exceptions in a table format for therapists to view specific dates when availability differs from regular schedule.

#### Scenario: View exceptions list

- **WHEN** therapist navigates to availability tab
- **THEN** system displays table with columns: Date, Start time, End time, Available toggle, Reason, Actions
- **AND** exceptions are sorted chronologically by date
- **AND** empty state displays when no exceptions exist
- **AND** table is responsive with horizontal scrolling on mobile
- **AND** available toggle clearly shows availability status

### Requirement: EM-002 - Add Availability Exception

The system SHALL allow therapists to add new availability exceptions to mark specific dates when they're unavailable or have different availability.

#### Scenario: Add new exception

- **WHEN** therapist clicks add exception button
- **THEN** system displays form with fields: Date picker, Start time, End time, Available toggle, Reason
- **AND** date picker prevents selecting past dates
- **AND** time inputs are optional for full-day exceptions
- **AND** available toggle defaults to false (unavailable)
- **AND** reason field is optional but recommended
- **AND** new exception appears in table immediately after adding
- **AND** form resets after successful addition

### Requirement: EM-003 - Edit Availability Exception

The system SHALL allow therapists to edit existing availability exceptions to update specific date availability when plans change.

#### Scenario: Edit existing exception

- **WHEN** therapist clicks edit button on an exception
- **THEN** system populates form with existing values
- **AND** all fields are editable with same validation as add form
- **AND** date can be changed to future dates only
- **AND** changes are reflected immediately in table after saving
- **AND** cancel option returns to original values
- **AND** edit mode is clearly indicated in the UI

### Requirement: EM-004 - Delete Availability Exception

The system SHALL allow therapists to delete availability exceptions to remove exceptions that are no longer needed.

#### Scenario: Delete exception

- **WHEN** therapist clicks delete button on an exception
- **THEN** system requires confirmation before removal
- **AND** exception is removed from table immediately after confirmation
- **AND** no orphaned data remains after deletion
- **AND** user receives confirmation toast after successful deletion

### Requirement: EM-005 - Validate Exception Data

The system SHALL provide real-time validation for exception data entry to prevent errors.

#### Scenario: Validate exception form

- **WHEN** therapist enters exception data
- **THEN** system validates that date is present or future
- **AND** validates that start time is before end time when both provided
- **AND** validates required field for date
- **AND** displays clear error messages for each validation failure
- **AND** prevents form submission with validation errors

### Requirement: EM-006 - Handle Full-Day Exceptions

The system SHALL support full-day exceptions to allow therapists to mark entire days as available or unavailable without specifying times.

#### Scenario: Create full-day exception

- **WHEN** therapist creates exception without time inputs
- **THEN** system allows empty time inputs in exception form
- **AND** applies exception to entire day when times are empty
- **AND** clearly indicates full-day vs time-specific exceptions in UI
- **AND** validates form allowing empty times when available toggle is set

## MODIFIED Requirements

### Requirement: PF-001 - Profile Page Layout

The profile page availability tab SHALL contain both weekly templates and exceptions management sections.

#### Scenario: View complete availability interface

- **WHEN** user navigates to availability tab
- **THEN** system displays exceptions section below weekly templates
- **AND** both sections maintain consistent styling
- **AND** clear visual separation exists between sections
- **AND** responsive design works for combined layout
