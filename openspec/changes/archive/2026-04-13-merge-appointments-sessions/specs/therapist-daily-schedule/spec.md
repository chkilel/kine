## MODIFIED Requirements

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
