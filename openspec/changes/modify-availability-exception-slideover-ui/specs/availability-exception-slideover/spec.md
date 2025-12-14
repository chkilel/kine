## MODIFIED Requirements

### Requirement: Component Interface for Exception Management

The AvailabilityExceptionSlideover component MUST provide a modern interface matching HTML reference design while preserving all existing props and events for adding and editing availability exceptions.

#### Scenario: Component accepts exception data for edit mode

**Given** AvailabilityExceptionSlideover component is opened via useOverlay
**When** an exception prop is provided through overlay.open()
**Then** the component should populate form fields with the exception data using UI matching HTML reference
**And** display in edit mode with appropriate title matching HTML header design (lines 221-223)
**And** preserve all existing prop interface without modification

#### Scenario: Component emits close event when cancelled

**Given** AvailabilityExceptionSlideover is open via useOverlay
**When** user clicks cancel button styled to match HTML reference (line 377-379)
**Then** the component should emit a close event with false value
**And** the overlay should close automatically with transition matching HTML

#### Scenario: Component emits save event with form data

**Given** AvailabilityExceptionSlideover has valid form data
**When** user clicks save button styled to match HTML reference (line 380-382)
**Then** the component should emit a close event with AvailabilityExceptionCreate data
**And** the overlay should close automatically
**And** preserve all existing event emission behavior

### Requirement: Form Validation for Exception Data

The component MUST validate all form inputs including required fields and optional time consistency with visual feedback matching HTML reference design.

#### Scenario: Required fields validation

**Given** exception form is displayed with styling matching HTML reference
**When** required fields (date, availability status) are empty
**Then** validation errors should be displayed using styling consistent with HTML reference
**And** save button should be disabled using button styling matching HTML

#### Scenario: Optional time validation

**Given** start and end times are provided using inputs styled to match HTML (lines 292-310)
**When** only one time is provided
**Then** validation error should be displayed with styling matching HTML reference
**And** user should be prompted to provide both or neither with clear messaging

### Requirement: UI Layout and Interactive Elements Matching HTML Reference

The component MUST display form sections and interactive elements exactly matching the HTML reference design (lines 219-383) while preserving all existing functionality.

#### Scenario: Form sections display correctly

**Given** exception slideover is open with styling matching HTML reference
**When** viewing form organized in sections matching HTML structure
**Then** date section should match HTML design (lines 231-290)
**And** time inputs section should match HTML design (lines 291-310)
**And** full day toggle should match HTML design (lines 311-319)
**And** availability status should match HTML design (lines 320-331)
**And** reason section should match HTML design (lines 332-373)

#### Scenario: Calendar component integration

**Given** date section is displayed using UCalendar component
**When** user interacts with calendar
**Then** calendar should display with styling matching HTML reference (lines 233-288)
**And** navigation buttons should match HTML styling (lines 234-241)
**And** date grid should match HTML layout and hover states (lines 243-287)
**And** selected date should be highlighted with primary color (#135bec) as in HTML

#### Scenario: Full day toggle functionality

**Given** exception form is displayed with toggle matching HTML reference (lines 311-319)
**When** user toggles full day option
**Then** start/end time fields should be hidden/shown accordingly
**And** toggle styling should exactly match HTML reference design
**And** form validation should adapt to the selection

#### Scenario: Availability status toggle

**Given** exception form is displayed with status toggle matching HTML (lines 320-331)
**When** user toggles availability status
**Then** toggle styling should exactly match HTML reference design
**And** the form should clearly indicate available/unavailable state
**And** reason options should adapt to the selection with conditional rendering

#### Scenario: Reason selection buttons

**Given** reason section is displayed with buttons matching HTML reference (lines 334-368)
**When** user selects a reason option
**Then** buttons should have exact styling matching HTML reference
**And** hover states should match HTML transitions
**And** selected state should use primary color (#135bec) as in HTML
**And** "Autre" option should show text input matching HTML (lines 369-372)

#### Scenario: Color scheme and styling consistency

**Given** component matches HTML reference design exactly
**When** viewing any interactive element
**Then** primary color (#135bec) should be used for primary actions
**And** surface colors should match HTML reference
**And** text colors should match HTML reference exactly
**And** borders and shadows should match HTML reference
**And** hover states and transitions should match HTML reference
