# Availability Exception Slideover Component

## ADDED Requirements

### Requirement: Component Interface for Exception Management

The AvailabilityExceptionSlideover component MUST provide a clean interface for adding and editing availability exceptions with proper props and events.

#### Scenario: Component accepts exception data for edit mode

**Given** the AvailabilityExceptionSlideover component is opened via useOverlay
**When** an exception prop is provided through overlay.open()
**Then** the component should populate form fields with the exception data
**And** display in edit mode with appropriate title

#### Scenario: Component emits close event when cancelled

**Given** the AvailabilityExceptionSlideover is open via useOverlay
**When** user clicks cancel or closes the slideover
**Then** the component should emit a close event with false value
**And** the overlay should close automatically

#### Scenario: Component emits save event with form data

**Given** the AvailabilityExceptionSlideover has valid form data
**When** user clicks save button
**Then** the component should emit a close event with AvailabilityExceptionCreate data
**And** the overlay should close automatically

### Requirement: Form Validation for Exception Data

The component MUST validate all form inputs including required fields and optional time consistency.

#### Scenario: Required fields validation

**Given** the exception form is displayed
**When** required fields (date, availability status) are empty
**Then** validation errors should be displayed
**And** save button should be disabled

#### Scenario: Optional time validation

**Given** start and end times are provided
**When** only one time is provided
**Then** validation error should be displayed
**And** user should be prompted to provide both or neither

### Requirement: UI Layout and Interactive Elements

The component MUST display form sections correctly and provide interactive toggles for full day and availability status.

#### Scenario: Form sections display correctly

**Given** the exception slideover is open
**When** viewing the form
**Then** date, timing, availability, and reason sections should be displayed
**And** each section should have appropriate icons and labels

#### Scenario: Full day toggle functionality

**Given** the exception form is displayed
**When** user toggles full day option
**Then** start/end time fields should be hidden/shown accordingly
**And** form validation should adapt to the selection

#### Scenario: Availability status toggle

**Given** the exception form is displayed
**When** user toggles availability status
**Then** the form should clearly indicate available/unavailable state
**And** reason options should adapt to the selection
