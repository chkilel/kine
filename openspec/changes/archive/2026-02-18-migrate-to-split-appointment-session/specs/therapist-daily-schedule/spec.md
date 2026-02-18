## MODIFIED Requirements

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

## ADDED Requirements

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
