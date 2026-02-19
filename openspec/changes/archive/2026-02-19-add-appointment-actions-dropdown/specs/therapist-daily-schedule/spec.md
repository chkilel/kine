## MODIFIED Requirements

### Requirement: Consultation Card Action Buttons

The system SHALL display appropriate action buttons on consultation cards based on consultation status, and provide a dropdown menu with additional actions based on appointment state.

#### Scenario: Always show View Details button

**Given** a consultation card is displayed for any consultation
**When** the card renders
**Then** the card always shows a "View Details" button
**And** the button is styled as a secondary action
**And** clicking the button navigates to consultation details page

#### Scenario: Button visibility based on status

**Given** a consultation card is displayed
**When** the consultation status is "scheduled" or "confirmed"
**Then** the card shows "Start Session" and "View Details" buttons

**Given** a consultation card is displayed
**When** the consultation status is "in_progress"
**Then** the card shows "Complete Session" and "View Details" buttons

**Given** a consultation card is displayed
**When** the consultation status is "completed", "cancelled", or "no_show"
**Then** the card shows only "View Details" button

#### Scenario: Dropdown menu actions for not-started appointments

**Given** an appointment card is displayed
**And** the appointment has status "scheduled" or "confirmed"
**And** no treatment session exists for this appointment
**When** the therapist clicks the dropdown menu button
**Then** the menu shows the following actions:

- "Patient" - navigates to patient detail page
- "Cancel Appointment" - opens confirmation modal
- "Postpone/Reschedule" - opens PlanningSlideover
- "Pre-Session Notes" - opens TreatmentSessionSlideover

#### Scenario: Dropdown menu actions for started appointments

**Given** an appointment card is displayed
**And** a treatment session exists for this appointment (in_progress or completed)
**When** the therapist clicks the dropdown menu button
**Then** the menu shows only the following actions:

- "Patient Details" - navigates to patient detail page
- "Session Details" - opens TreatmentSessionSlideover

#### Scenario: Cancel appointment with confirmation

**Given** an appointment has status "scheduled"
**And** no treatment session exists
**When** the therapist clicks "Cancel Appointment" from the dropdown menu
**Then** a confirmation modal appears
**And** the modal shows a warning message about cancellation
**And** the modal has "Confirm" and "Cancel" buttons
**When** the therapist confirms
**Then** the appointment status is updated to "cancelled"
**And** a success toast notification appears
**And** the appointment list refreshes to show the updated status

#### Scenario: Cancel appointment cancelled by user

**Given** a confirmation modal is displayed for appointment cancellation
**When** the therapist clicks "Cancel" button
**Then** the modal closes
**And** the appointment status remains unchanged

#### Scenario: Postpone appointment via PlanningSlideover

**Given** an appointment has status "scheduled"
**And** no treatment session exists
**When** the therapist clicks "Postpone/Reschedule" from the dropdown menu
**Then** the PlanningSlideover opens
**And** the slideover is pre-filled with the current appointment data
**And** the therapist can modify the appointment date/time
**And** saving changes updates the appointment

#### Scenario: Pre-session notes for scheduled appointment

**Given** an appointment has status "scheduled"
**And** no treatment session exists
**When** the therapist clicks "Pre-Session Notes" from the dropdown menu
**Then** the TreatmentSessionSlideover opens
**And** the therapist can view and add pre-session notes
**And** the slideover shows patient information and appointment details

#### Scenario: Session details for in-progress appointment

**Given** an appointment has a treatment session with status "in_progress"
**When** the therapist clicks "Session Details" from the dropdown menu
**Then** the TreatmentSessionSlideover opens
**And** the slideover shows the current treatment session details
**And** the therapist can continue editing the session

## ADDED Requirements

### Requirement: Appointment Dropdown Menu Icons

The system SHALL display intuitive icons for each dropdown menu action to improve usability.

#### Scenario: Display icons for appointment actions

**Given** the appointment dropdown menu is displayed
**When** the menu items are rendered
**Then** each action has an appropriate icon:

- "Patient" / "Patient Details" - profile/user icon
- "Cancel Appointment" - cancel/X icon
- "Postpone/Reschedule" - calendar/clock icon
- "Pre-Session Notes" / "Session Details" - notes/edit icon

### Requirement: Dropdown Menu State Management

The system SHALL properly manage the state of dropdown menu actions based on real-time appointment data.

#### Scenario: Refresh menu items on appointment update

**Given** an appointment card is displayed with a dropdown menu
**And** the appointment status changes (e.g., from scheduled to cancelled)
**When** the appointment data is updated
**Then** the dropdown menu items reflect the new appointment state
**And** actions are enabled/disabled based on the new status

#### Scenario: Disable actions appropriately

**Given** an appointment dropdown menu is displayed
**When** an action is in progress (e.g., cancellation is being processed)
**Then** the menu items remain interactive but show loading state if needed
**And** duplicate actions are prevented until the current operation completes
