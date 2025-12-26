## ADDED Requirements

### Requirement: WA-001 - Display Weekly Availability Templates

The system SHALL display weekly availability templates in a table format for therapists to view their recurring schedule patterns.

#### Scenario: View weekly templates

- **WHEN** therapist navigates to availability tab
- **THEN** system displays table with columns: Day of week, Start time, End time, Location, Max sessions, Actions
- **AND** templates are sorted by day of week (Monday to Sunday)
- **AND** empty state displays when no templates exist
- **AND** table is responsive with horizontal scrolling on mobile
- **AND** location labels use existing CONSULTATION_LOCATION_OPTIONS

### Requirement: WA-002 - Add Weekly Availability Template

The system SHALL allow therapists to add new weekly availability templates to define their recurring availability for specific days.

#### Scenario: Add new template

- **WHEN** therapist clicks add template button
- **THEN** system displays form with fields: Day selection, Start time, End time, Location, Max sessions
- **AND** day selection uses PREFERRED_DAYS_OPTIONS from constants
- **AND** location selection uses CONSULTATION_LOCATION_OPTIONS from constants
- **AND** time inputs validate that end time is after start time
- **AND** max sessions input accepts positive integers (1-10)
- **AND** new template appears in table immediately after adding
- **AND** form resets after successful addition

### Requirement: WA-003 - Edit Weekly Availability Template

The system SHALL allow therapists to edit existing weekly availability templates to update their recurring schedule.

#### Scenario: Edit existing template

- **WHEN** therapist clicks edit button on a template
- **THEN** system populates form with existing values
- **AND** all fields are editable with same validation as add form
- **AND** changes are reflected immediately in table after saving
- **AND** cancel option returns to original values
- **AND** edit mode is clearly indicated in the UI

### Requirement: WA-004 - Delete Weekly Availability Template

The system SHALL allow therapists to delete weekly availability templates to remove availability patterns they no longer follow.

#### Scenario: Delete template

- **WHEN** therapist clicks delete button on a template
- **THEN** system requires confirmation before removal
- **AND** template is removed from table immediately after confirmation
- **AND** no orphaned data remains after deletion
- **AND** user receives confirmation toast after successful deletion

### Requirement: WA-005 - Validate Weekly Template Data

The system SHALL provide real-time validation for weekly template data entry to prevent errors.

#### Scenario: Validate template form

- **WHEN** therapist enters availability data
- **THEN** system validates that start time is before end time
- **AND** validates that max sessions is positive integer
- **AND** validates required fields for all inputs
- **AND** displays clear error messages for each validation failure
- **AND** prevents form submission with validation errors

## MODIFIED Requirements

### Requirement: PF-001 - Profile Page Layout

The profile page SHALL include the availability tab with weekly availability management interface.

#### Scenario: Navigate to availability tab

- **WHEN** user clicks on availability tab
- **THEN** system displays weekly templates section
- **AND** layout is consistent with existing profile tab styling
- **AND** responsive design works on mobile and desktop
- **AND** navigation between tabs remains functional
