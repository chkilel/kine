# therapist-daily-schedule Specification

## Purpose

Therapist daily schedule using unified appointment model. Status is read directly from the appointment record - no separate treatment session lookup needed.

## Requirements

### Requirement: Daily Summary Statistics

The system SHALL display summary statistics at the top of the therapist's daily schedule page based on the unified appointment status.

#### Scenario: Display in-progress count

- **GIVEN** a therapist has 2 appointments with status "in_progress" for the day
- **WHEN** the therapist views their daily schedule page
- **THEN** the summary section shows "En cours: 2"
- **AND** this counts appointments with status "in_progress" (no separate treatment session query needed)

#### Scenario: Display completed count

- **GIVEN** a therapist has 3 appointments with status "completed" for the day
- **WHEN** the therapist views their daily schedule page
- **THEN** the summary section shows "Terminées: 3"
- **AND** this counts appointments with status "completed" or "finished"

### Requirement: Consultation Card Overview

The system SHALL display each appointment as a card with essential information. Status is read directly from the unified appointment status field — no separate treatment session lookup needed.

#### Scenario: Display appointment with no session started

- **GIVEN** an appointment exists with status "scheduled"
- **WHEN** the appointment card is displayed
- **THEN** the card shows "À venir" status badge (from appointment.status)
- **AND** the card shows "Démarrer la séance" button

#### Scenario: Display appointment with in-progress session

- **GIVEN** an appointment exists with status "in_progress"
- **WHEN** the appointment card is displayed
- **THEN** the card shows "En cours" status badge (from appointment.status directly)
- **AND** the card shows timer duration from appointment.actualStartTime
- **AND** the card shows "Continuer la séance" button

#### Scenario: Display completed appointment

- **GIVEN** an appointment exists with status "completed"
- **WHEN** the appointment card is displayed
- **THEN** the card shows "Terminée" status badge
- **AND** the card shows actual duration from appointment.actualDurationSeconds
- **AND** the card shows "Voir détails" button only

### Requirement: Session Start from Daily View

The system SHALL allow therapists to start a session by transitioning appointment status to in_progress, without creating a separate treatment session.

#### Scenario: Start session from daily view transitions appointment status

- **GIVEN** a therapist is viewing the daily schedule
- **AND** an appointment has status "scheduled" or "confirmed"
- **WHEN** the therapist clicks the "Démarrer la séance" button
- **THEN** the system calls POST /api/appointments/[id]/start
- **AND** appointment status transitions to "in_progress"
- **AND** the consultation slideover opens with the appointment data

#### Scenario: Show Continue Session button for in-progress appointment

- **GIVEN** an appointment has status "in_progress"
- **WHEN** the appointment card is displayed
- **THEN** the card shows a "Continuer la séance" button
- **AND** clicking opens the consultation slideover with the appointment

### Requirement: Consultation Status Update

The system SHALL use a single unified status on the appointment. No separate treatment session status exists.

#### Scenario: Appointment status flow (unified)

- **GIVEN** a new appointment is created
- **THEN** appointment status is "scheduled"
- **WHEN** appointment is confirmed
- **THEN** appointment status becomes "confirmed"
- **WHEN** session is started
- **THEN** appointment status transitions to "in_progress"
- **WHEN** session is ended
- **THEN** appointment status transitions to "finished"
- **WHEN** billing is completed
- **THEN** appointment status transitions to "completed"

### Requirement: Consultation Card Action Buttons

The system SHALL display action buttons based on the unified appointment status.

#### Scenario: Button visibility based on unified status

- **GIVEN** a consultation card is displayed
- **WHEN** the appointment status is "scheduled" or "confirmed"
- **THEN** the card shows "Démarrer la séance" and "Voir détails" buttons

- **GIVEN** a consultation card is displayed
- **WHEN** the appointment status is "in_progress"
- **THEN** the card shows "Terminer la séance" and "Voir détails" buttons

- **GIVEN** a consultation card is displayed
- **WHEN** the appointment status is "finished" or "completed" or "cancelled" or "no_show"
- **THEN** the card shows only "Voir détails" button

#### Scenario: Dropdown menu actions based on unified status

- **GIVEN** an appointment has status "scheduled" or "confirmed"
- **WHEN** the therapist clicks the dropdown menu button
- **THEN** the menu shows: "Patient", "Annuler le rendez-vous", "Reporter/Reprogrammer", "Notes pré-séance"

- **GIVEN** an appointment has status "in_progress"
- **WHEN** the therapist clicks the dropdown menu button
- **THEN** the menu shows: "Détails patient", "Détails séance"

### Requirement: In-Progress Appointments Display

The system SHALL display in-progress appointments prominently at the top of the daily schedule based on the unified status field.

#### Scenario: Show in-progress appointments section

- **GIVEN** a therapist has appointments with status "in_progress"
- **WHEN** the therapist views their daily schedule
- **THEN** an "En cours" section appears at the top
- **AND** it displays all appointments with status "in_progress"
- **AND** each shows patient name, appointment time, and elapsed time

### Requirement: Treatment Session Data Display

The system SHALL display session information on appointment cards directly from the appointment record.

#### Scenario: Show pain level on completed appointment card

- **GIVEN** an appointment exists with painLevelBefore = 7 and painLevelAfter = 3
- **WHEN** the appointment card is displayed
- **THEN** the card shows "Douleur: 7 → 3"
- **AND** data is read from appointment.painLevelBefore and appointment.painLevelAfter

#### Scenario: Show session tags on card

- **GIVEN** an appointment has tags ["Douleur Diminuée", "Renforcement"]
- **WHEN** the appointment card is displayed
- **THEN** the card shows these tags as badges

### Requirement: Treatment Session Lazy Loading

The system SHALL load all appointment data (including clinical fields) in a single query. No separate treatment session fetch is needed.

#### Scenario: Load appointments with all data

- **GIVEN** the daily schedule page loads
- **WHEN** appointments are fetched
- **THEN** the API returns appointments with all fields inline (clinical, timer, billing)
- **AND** no separate treatment session query is needed

- **GIVEN** an appointment exists with no related treatment session
- **AND** appointment status is "scheduled"
- **WHEN** the appointment card is displayed
- **THEN** the card shows "À venir" status badge
- **AND** the card shows "Start Session" button

#### Scenario: Display appointment with in-progress treatment session

- **GIVEN** an appointment exists with a treatment session
- **AND** treatment session status is "in_progress"
- **WHEN** the appointment card is displayed
- **THEN** the card shows "En cours" status badge (from treatment session)
- **AND** the card shows timer duration if available
- **AND** the card shows "Continue Session" button

#### Scenario: Display completed appointment

- **GIVEN** an appointment exists with status "completed"
- **WHEN** the appointment card is displayed
  - **THEN** the card shows "Terminée" status badge
  - **AND** the card shows actual duration of the session (from treatment session)
  - **AND** the card shows "View Details" button only

### Requirement: Session Start from Daily View

The system SHALL allow therapists to start a consultation session directly from the daily schedule view by creating a treatment session linked to the appointment.

#### Scenario: Show Start Session button for scheduled appointments

- **GIVEN** an appointment has status "scheduled"
- **AND** no treatment session exists for this appointment
- **WHEN** the appointment card is displayed
- **THEN** the card shows a "Démarrer la séance" (Start Session) button
- **AND** the button is styled as a primary action
- **AND** the button displays a play icon

#### Scenario: Show Continue Session button for appointments with in-progress treatment session

- **GIVEN** an appointment has status "confirmed"
- **AND** a treatment session exists with status "in_progress"
- **WHEN** the appointment card is displayed
- **THEN** the card shows a "Continuer la séance" (Continue Session) button
- **AND** the button is styled as a primary action
- **AND** clicking opens the treatment session slideover

#### Scenario: Start session from daily view creates treatment session

- **GIVEN** a therapist is viewing the daily schedule
- **AND** an appointment has status "scheduled" or "confirmed"
- **AND** no treatment session exists for this appointment
- **WHEN** the therapist clicks the "Start Session" button on the appointment card
- **THEN** the system calls POST /api/treatment-sessions with appointmentId
- **AND** a treatment session is created with status "in_progress"
- **AND** the consultation slideover opens with the new treatment session

#### Scenario: Do not show Start Session button for completed appointments

- **GIVEN** an appointment has status "completed"
- **WHEN** the appointment card is displayed
- **THEN** the card does NOT show a "Start Session" button
- **AND** the card shows a "View Details" button instead

### Requirement: Consultation Status Update

The system SHALL support appointment statuses (scheduled, confirmed, cancelled, no_show, completed) separate from treatment session status.

#### Scenario: Appointment status flow

- **GIVEN** a new appointment is created
- **THEN** appointment status is "scheduled"
- **WHEN** appointment is confirmed
- **THEN** appointment status becomes "confirmed"
- **WHEN** a treatment session is created and started
- **THEN** appointment status remains "confirmed"
- **AND** treatment session status is "in_progress"
- **WHEN** the treatment session is marked as "completed"
- **THEN** appointment status is updated to "completed"
- **AND** the treatment session status is "completed"

### Requirement: Session Start from Consultation Details

The system SHALL allow therapists to start and complete sessions from the consultation details page.

#### Scenario: Show Start Session button on consultation details page

**Given** a therapist views consultation details page
**And** the consultation has status "scheduled" or "confirmed"
**When** the page loads
**Then** the page displays a "Start Session" button
**And** the button is prominently positioned

#### Scenario: Start session from consultation details page

**Given** a therapist views consultation details page
**And** the consultation has status "scheduled"
**When** the therapist clicks the "Start Session" button
**Then** the system updates the consultation status to "in_progress"
**And** the page refreshes to show the new status
**And** the "Start Session" button is replaced with "Complete Session" button

#### Scenario: Complete session from consultation details page

**Given** a therapist views consultation details page
**And** the consultation has status "in_progress"
**When** the therapist clicks the "Complete Session" button
**Then** the system displays a confirmation dialog
**And** upon confirmation, updates the consultation status to "completed"
**And** the page refreshes to show the new status

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

### Requirement: Date Navigation

The system SHALL provide navigation controls to view consultations for different dates.

#### Scenario: Navigate to previous day

**Given** the therapist is viewing the schedule for "2026-01-16"
**When** the therapist clicks the "Previous Day" button
**Then** the page displays consultations for "2026-01-15"
**And** the URL updates to `?date=2026-01-15`

#### Scenario: Navigate to next day

**Given** the therapist is viewing the schedule for "2026-01-16"
**When** the therapist clicks the "Next Day" button
**Then** the page displays consultations for "2026-01-17"
**And** the URL updates to `?date=2026-01-17`

#### Scenario: Select specific date

**Given** the therapist is viewing the schedule for "2026-01-16"
**When** the therapist uses the date picker to select "2026-01-20"
**Then** the page displays consultations for "2026-01-20"
**And** the URL updates to `?date=2026-01-20`

#### Scenario: Default to today when no date specified

**Given** the therapist navigates to `/therapists/day` without a date parameter
**When** the page loads
**Then** the page displays consultations for the current day
**And** the URL updates to include today's date

### Requirement: Navigation to Details

The system SHALL allow therapists to navigate to detailed views from the daily schedule.

#### Scenario: Navigate to patient details

**Given** the consultation card shows patient "John Doe"
**When** the therapist clicks on the patient's name
**Then** the page navigates to `/patients/[patientId]`
**And** the therapist can view the patient's full details

#### Scenario: Navigate to consultation details

**Given** the consultation card is displayed
**When** the therapist clicks anywhere on the consultation card (except patient name)
**Then** the page navigates to `/patients/[patientId]/consultations/[consultationId]`
**And** the therapist can view and edit the full consultation details

### Requirement: Therapist Consultations API Endpoint

The system SHALL provide an API endpoint to fetch consultations for the authenticated therapist.

#### Scenario: Fetch consultations for specific date

**Given** the therapist is authenticated with ID "therapist-123"
**And** the therapist has consultations on "2026-01-16"
**When** the client requests `GET /api/therapists/consultations?date=2026-01-16`
**Then** the server returns a JSON array of consultations
**And** each consultation includes patient name and room name
**And** consultations are sorted by startTime ascending
**And** only consultations for the authenticated therapist are returned

#### Scenario: Reject invalid date format

**Given** the therapist is authenticated
**When** the client requests `GET /api/therapists/consultations?date=invalid-date`
**Then** the server returns HTTP 400 Bad Request
**And** the error message states "Date invalide"

#### Scenario: Require authentication

**Given** the client is not authenticated
**When** the client requests `GET /api/therapists/consultations?date=2026-01-16`
**Then** the server returns HTTP 401 Unauthorized
**Or** the server redirects to the login page

### Requirement: Therapist Data Isolation

The system SHALL ensure therapists can only view their own consultations, not other therapists' schedules.

#### Scenario: Filter by authenticated therapist

**Given** two therapists exist: therapist A (ID "t-a") and therapist B (ID "t-b")
**And** therapist A has consultations on "2026-01-16"
**And** therapist B has consultations on "2026-01-16"
**When** therapist A requests their daily schedule
**Then** only therapist A's consultations are returned
**And** therapist B's consultations are not included in the response

#### Scenario: Prevent cross-therapist data access

**Given** therapist A is authenticated
**And** therapist A knows therapist B's patient IDs
**When** therapist A requests consultations for a date where therapist B has appointments
**Then** the system filters to only return therapist A's consultations
**And** therapist B's consultation data is not accessible to therapist A

### Requirement: Loading and Error States

The system SHALL display appropriate loading and error states during data fetching.

#### Scenario: Show loading state

**Given** the therapist navigates to `/therapists/day`
**And** the API request is in progress
**When** the page is rendering
**Then** a loading indicator or skeleton UI is displayed
**And** the user can see data is being fetched

#### Scenario: Show error state

**Given** the therapist navigates to `/therapists/day`
**And** the API request fails with an error
**When** the page receives the error
**Then** an error message is displayed
**And** a retry button is provided to retry the request

### Requirement: Keyboard Navigation

The system SHALL support keyboard shortcuts for date navigation.

#### Scenario: Navigate to previous day with keyboard

**Given** the therapist is viewing the daily schedule page
**When** the therapist presses the left arrow key
**Then** the page navigates to the previous day

#### Scenario: Navigate to next day with keyboard

**Given** the therapist is viewing the daily schedule page
**When** the therapist presses the right arrow key
**Then** the page navigates to the next day

### Requirement: Mobile Responsiveness

The system SHALL be usable on mobile devices with appropriate responsive design.

#### Scenario: View daily schedule on mobile

**Given** the therapist is using a mobile device
**When** the therapist views their daily schedule
**Then** the layout adapts to the smaller screen
**And** consultation cards stack vertically
**And** navigation controls remain accessible
**And** text is readable without horizontal scrolling

### Requirement: In-Progress Appointments Display

The system SHALL display in-progress treatment sessions prominently at the top of the daily schedule.

#### Scenario: Show in-progress treatment sessions section

- **GIVEN** a therapist has appointments with treatment sessions in "in_progress" status
- **WHEN** the therapist views their daily schedule
- **THEN** an "En cours" section appears at the top
- **AND** it displays all treatment sessions with status "in_progress"
- **AND** each shows patient name, appointment time, and elapsed time
- **AND** clicking navigates to the session slideover

### Requirement: Treatment Session Data Display

The system SHALL display treatment session information on appointment cards when a session exists.

#### Scenario: Show pain level on completed session card

- **GIVEN** a treatment session exists with painLevelBefore = 7 and painLevelAfter = 3
- **WHEN** the appointment card is displayed
- **THEN** the card shows "Douleur: 7 → 3" or similar indicator
- **AND** this indicates pain improvement

#### Scenario: Show session tags on card

- **GIVEN** a treatment session has tags ["Douleur Diminuée", "Renforcement"]
- **WHEN** the appointment card is displayed
- **THEN** the card shows these tags as badges
- **AND** tags are displayed in a compact format

### Requirement: Treatment Session Lazy Loading

The system SHALL efficiently load treatment session data only when needed.

#### Scenario: Load appointments without treatment sessions initially

- **GIVEN** the daily schedule page loads
- **WHEN** appointments are fetched
- **THEN** the API returns appointments with optional treatmentSession relation
- **AND** treatment session data is included only if it exists
- **AND** the UI handles both cases (with and without treatment session)

#### Scenario: Load full treatment session data when opening slideover

- **GIVEN** a therapist clicks to view a treatment session
- **WHEN** the slideover opens
- **THEN** the full treatment session is fetched with all details
- **AND** this includes notes, pain levels, tags, timer state

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
