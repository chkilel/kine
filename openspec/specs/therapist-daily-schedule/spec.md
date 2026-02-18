# therapist-daily-schedule Specification

## Purpose
TBD - created by archiving change 2026-01-16-add-therapist-day-start-screen. Update Purpose after archive.
## Requirements
### Requirement: Therapist Daily Schedule View

The system SHALL provide a dedicated page for therapists to view their daily schedule, showing all consultations for a selected date.

#### Scenario: Therapist views their daily schedule

**Given** a therapist is logged in
**And** the therapist has consultations scheduled for "2026-01-16"
**When** the therapist navigates to `/therapists/day?date=2026-01-16`
**Then** the page displays all consultations for that day
**And** consultations are sorted chronologically by start time
**And** each consultation shows patient name, time range, type, and status

#### Scenario: Therapist views empty schedule

**Given** a therapist is logged in
**And** the therapist has no consultations scheduled for "2026-01-17"
**When** the therapist navigates to `/therapists/day?date=2026-01-17`
**Then** the page displays an empty state message
**And** the message indicates no consultations are scheduled for that day

### Requirement: Daily Summary Statistics

The system SHALL display summary statistics at the top of the therapist's daily schedule page based on treatment sessions.

#### Scenario: Display completed session count

- **GIVEN** a therapist has 3 treatment sessions with status "completed" for the day
- **WHEN** the therapist views their daily schedule page
- **THEN** the summary section shows "Terminées: 3"
- **AND** this counts treatment sessions, not appointments

#### Scenario: Display in-progress session count

- **GIVEN** a therapist has 2 treatment sessions with status "in_progress" for the day
- **WHEN** the therapist views their daily schedule page
- **THEN** the summary section shows "En cours: 2"
- **AND** this is a new statistic added to the daily view

### Requirement: Consultation Card Overview

The system SHALL display each appointment as a card with essential information and treatment session status when applicable.

#### Scenario: Display appointment with no treatment session

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

The system SHALL display appropriate action buttons on consultation cards based on consultation status.

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

